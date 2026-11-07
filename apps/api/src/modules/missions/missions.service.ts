import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Mission, MissionStatus } from '../../database/entities/mission.entity';
import { MissionItem } from '../../database/entities/mission-item.entity';
import { Payment, PaymentMethod } from '../../database/entities/payment.entity';
import { PodRecord } from '../../database/entities/pod-record.entity';
import { ReturnRecord, ReturnKind } from '../../database/entities/return-record.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { CustomerLedger } from '../../database/entities/customer-ledger.entity';
import { Customer } from '../../database/entities/customer.entity';
import { IdempotencyKey } from '../../database/entities/idempotency-key.entity';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission) private missionRepo: Repository<Mission>,
    @InjectRepository(IdempotencyKey) private idemRepo: Repository<IdempotencyKey>,
    private dataSource: DataSource,
  ) {}

  findByShift(shiftId: string) {
    return this.missionRepo.find({
      where: { shiftId },
      relations: ['items', 'payments', 'pod', 'customer'],
      order: { seq: 'ASC' },
    });
  }

  async findOne(id: string) {
    const m = await this.missionRepo.findOne({
      where: { id },
      relations: ['items', 'payments', 'pod', 'customer'],
    });
    if (!m) throw new NotFoundException('Mission not found');
    return m;
  }

  async create(data: {
    shiftId: string;
    customerId: string;
    seq?: number;
    plannedAmount?: number;
    items?: { productId: string; orderedQty: number; unitPrice?: number }[];
  }) {
    const mission = this.missionRepo.create({
      shiftId: data.shiftId,
      customerId: data.customerId,
      seq: data.seq || 0,
      plannedAmount: data.plannedAmount || 0,
      status: MissionStatus.PENDING,
      items: (data.items || []).map((i) =>
        Object.assign(new MissionItem(), {
          productId: i.productId,
          orderedQty: i.orderedQty,
          deliveredQty: 0,
          unitPrice: i.unitPrice || 0,
          lineTotal: 0,
        }),
      ),
    });
    return this.missionRepo.save(mission);
  }

  async markArrival(id: string, lat?: number, lng?: number, distanceM?: number) {
    const m = await this.findOne(id);
    if (m.status === MissionStatus.PENDING) m.status = MissionStatus.ACCEPTED;
    m.status = MissionStatus.IN_PROGRESS;
    m.arrivalAt = new Date();
    m.arrivalLat = lat ?? null;
    m.arrivalLng = lng ?? null;
    m.arrivalDistanceM = distanceM ?? null;
    return this.missionRepo.save(m);
  }

  /**
   * بستن مأموریت — تراکنش اتمیک G3 + G5 + G4 Idempotency
   */
  async completeMission(
    missionId: string,
    userId: string,
    clientOpId: string | undefined,
    payload: {
      items: { productId: string; deliveredQty: number }[];
      payments: { amount: number; method: PaymentMethod; referenceNumber?: string; isPartial?: boolean }[];
      pod: { recipientName: string; signatureUrl?: string; photoUrl?: string; lat?: number; lng?: number };
      returns?: { productId: string; qty: number; kind: ReturnKind; note?: string }[];
      failReason?: string;
    },
  ) {
    // G4 Idempotency
    if (clientOpId) {
      const existing = await this.idemRepo.findOne({ where: { clientOpId } });
      if (existing?.response) return existing.response;
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const mission = await manager.findOne(Mission, {
        where: { id: missionId },
        relations: ['items'],
      });
      if (!mission) throw new NotFoundException('Mission not found');
      if (mission.status === MissionStatus.COMPLETED) {
        throw new BadRequestException('Mission already completed');
      }

      if (payload.failReason) {
        mission.status = MissionStatus.FAILED;
        mission.failReason = payload.failReason;
        mission.completedAt = new Date();
        await manager.save(mission);
        return { mission };
      }

      // POD
      if (!payload.pod?.recipientName) {
        throw new BadRequestException('Recipient name required');
      }
      const pod = manager.create(PodRecord, {
        missionId,
        recipientName: payload.pod.recipientName,
        signatureUrl: payload.pod.signatureUrl || null,
        photoUrl: payload.pod.photoUrl || null,
        lat: payload.pod.lat ?? null,
        lng: payload.pod.lng ?? null,
      });
      await manager.save(pod);

      let deliveredAmount = 0;

      // Items + G3 inventory deduction
      for (const line of payload.items || []) {
        const item = mission.items?.find((i) => i.productId === line.productId);
        if (item) {
          item.deliveredQty = line.deliveredQty;
          item.lineTotal = item.deliveredQty * Number(item.unitPrice);
          deliveredAmount += item.lineTotal;
          await manager.save(item);
        }

        // Lock and update shift_inventory
        const inv = await manager.findOne(ShiftInventory, {
          where: { shiftId: mission.shiftId, productId: line.productId },
        });
        if (inv) {
          if (line.deliveredQty > inv.remainingQty) {
            throw new BadRequestException(`Insufficient inventory for product ${line.productId}`);
          }
          inv.deliveredQty += line.deliveredQty;
          inv.remainingQty = inv.openingQty - inv.deliveredQty;
          await manager.save(inv);
        }
      }

      // Payments
      let collected = 0;
      for (const p of payload.payments || []) {
        const payment = manager.create(Payment, {
          missionId,
          amount: Math.round(Number(p.amount) || 0),
          method: p.method,
          referenceNumber: p.referenceNumber || null,
          isPartial: p.isPartial || false,
        });
        await manager.save(payment);
        collected += Number(p.amount);

        // G5 ledger: payment reduces debt
        if (p.amount) {
          const ledger = manager.create(CustomerLedger, {
            customerId: mission.customerId,
            delta: -Number(p.amount),
            reason: 'payment',
            missionId,
            paymentId: payment.id,
          });
          await manager.save(ledger);
        }
      }

      // G5 returns
      for (const r of payload.returns || []) {
        const ret = manager.create(ReturnRecord, {
          missionId,
          productId: r.productId,
          qty: r.qty,
          kind: r.kind,
          note: r.note || null,
        });
        await manager.save(ret);

        // optionally restock non-damaged returns
        if (r.kind === ReturnKind.RETURN) {
          const inv = await manager.findOne(ShiftInventory, {
            where: { shiftId: mission.shiftId, productId: r.productId },
          });
          if (inv) {
            inv.deliveredQty = Math.max(0, inv.deliveredQty - r.qty);
            inv.remainingQty = inv.openingQty - inv.deliveredQty;
            await manager.save(inv);
          }
        }
      }

      // debt for unpaid delivered amount
      const unpaid = deliveredAmount - collected;
      if (unpaid > 0) {
        const ledger = manager.create(CustomerLedger, {
          customerId: mission.customerId,
          delta: unpaid,
          reason: 'delivery_unpaid',
          missionId,
        });
        await manager.save(ledger);

        const customer = await manager.findOne(Customer, { where: { id: mission.customerId } });
        if (customer) {
          customer.outstandingDebt = Number(customer.outstandingDebt) + unpaid;
          await manager.save(customer);
        }
      } else if (collected > 0) {
        const customer = await manager.findOne(Customer, { where: { id: mission.customerId } });
        if (customer) {
          customer.outstandingDebt = Math.max(0, Number(customer.outstandingDebt) - collected);
          await manager.save(customer);
        }
      }

      mission.deliveredAmount = deliveredAmount;
      mission.collectedAmount = collected;
      mission.status = MissionStatus.COMPLETED;
      mission.completedAt = new Date();
      await manager.save(mission);

      return { mission, deliveredAmount, collected };
    });

    // store idempotency response
    if (clientOpId) {
      const key = this.idemRepo.create({
        clientOpId,
        userId,
        endpoint: `missions/${missionId}/complete`,
        response: result,
        statusCode: 200,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      });
      await this.idemRepo.save(key);
    }

    return result;
  }
}
