import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
import { Shift } from '../../database/entities/shift.entity';
import { Driver } from '../../database/entities/driver.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission) private missionRepo: Repository<Mission>,
    @InjectRepository(IdempotencyKey) private idemRepo: Repository<IdempotencyKey>,
    @InjectRepository(Shift) private shiftRepo: Repository<Shift>,
    @InjectRepository(Driver) private driverRepo: Repository<Driver>,
    private dataSource: DataSource,
    private audit: AuditService,
  ) {}

  private isStaff(user: any) {
    return !!(
      user?.isSuperAdmin ||
      user?.roles?.includes('super_admin') ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('supervisor') ||
      user?.permissions?.includes('*') ||
      user?.permissions?.includes('missions:assign')
    );
  }

  async assertCanAccessShift(shiftId: string, user: any) {
    if (this.isStaff(user)) return;
    const shift = await this.shiftRepo.findOne({
      where: { id: shiftId },
      relations: ['driver'],
    });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.driver?.userId !== user.id) {
      throw new ForbiddenException('Not your shift');
    }
  }

  async findByShift(shiftId: string, user: any) {
    await this.assertCanAccessShift(shiftId, user);
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
    if (!data.shiftId || !data.customerId) {
      throw new BadRequestException('shiftId and customerId required');
    }
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

  async markArrival(id: string, user: any, lat?: number, lng?: number, distanceM?: number) {
    const m = await this.findOne(id);
    await this.assertCanAccessShift(m.shiftId, user);

    if (m.status === MissionStatus.COMPLETED || m.status === MissionStatus.FAILED) {
      throw new BadRequestException('Cannot arrive on a closed mission');
    }
    if (m.status === MissionStatus.PENDING) m.status = MissionStatus.ACCEPTED;
    m.status = MissionStatus.IN_PROGRESS;
    m.arrivalAt = new Date();
    m.arrivalLat = lat ?? null;
    m.arrivalLng = lng ?? null;
    m.arrivalDistanceM = distanceM ?? null;
    return this.missionRepo.save(m);
  }

  async completeMission(
    missionId: string,
    user: any,
    clientOpId: string | undefined,
    payload: {
      items: { productId: string; deliveredQty: number }[];
      payments: { amount: number; method: PaymentMethod; referenceNumber?: string; isPartial?: boolean }[];
      pod: { recipientName: string; signatureUrl?: string; photoUrl?: string; lat?: number; lng?: number };
      returns?: { productId: string; qty: number; kind: ReturnKind; note?: string }[];
      failReason?: string;
    },
  ) {
    const existingMission = await this.findOne(missionId);
    await this.assertCanAccessShift(existingMission.shiftId, user);

    if (clientOpId) {
      if (!/^[0-9a-fA-F-]{36}$/.test(clientOpId)) {
        throw new BadRequestException('Invalid X-Client-Op-Id (UUID required)');
      }
      const existing = await this.idemRepo.findOne({
        where: { clientOpId, userId: user.id },
      });
      if (existing?.response) return existing.response;
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const mission = await manager.findOne(Mission, {
        where: { id: missionId },
        relations: ['items'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!mission) throw new NotFoundException('Mission not found');
      if (mission.status === MissionStatus.COMPLETED || mission.status === MissionStatus.FAILED) {
        throw new BadRequestException('Mission already closed');
      }

      if (payload.failReason) {
        mission.status = MissionStatus.FAILED;
        mission.failReason = payload.failReason;
        mission.completedAt = new Date();
        await manager.save(mission);
        return { mission };
      }

      if (!payload.pod?.recipientName?.trim()) {
        throw new BadRequestException('Recipient name required');
      }

      const pod = manager.create(PodRecord, {
        missionId,
        recipientName: payload.pod.recipientName.trim(),
        signatureUrl: payload.pod.signatureUrl || null,
        photoUrl: payload.pod.photoUrl || null,
        lat: payload.pod.lat ?? null,
        lng: payload.pod.lng ?? null,
      });
      await manager.save(pod);

      let deliveredAmount = 0;

      for (const line of payload.items || []) {
        const qty = Number(line.deliveredQty);
        if (!Number.isFinite(qty) || qty < 0) {
          throw new BadRequestException('deliveredQty must be >= 0');
        }
        const item = mission.items?.find((i) => i.productId === line.productId);
        if (item) {
          item.deliveredQty = qty;
          item.lineTotal = qty * Number(item.unitPrice);
          deliveredAmount += Number(item.lineTotal);
          await manager.save(item);
        }

        const inv = await manager
          .getRepository(ShiftInventory)
          .createQueryBuilder('inv')
          .setLock('pessimistic_write')
          .where('inv.shift_id = :shiftId AND inv.product_id = :productId', {
            shiftId: mission.shiftId,
            productId: line.productId,
          })
          .getOne();

        if (inv) {
          if (qty > Number(inv.remainingQty)) {
            throw new BadRequestException(`Insufficient inventory for product ${line.productId}`);
          }
          inv.deliveredQty = Number(inv.deliveredQty) + qty;
          inv.remainingQty = Number(inv.openingQty) - Number(inv.deliveredQty);
          await manager.save(inv);
        } else if (qty > 0) {
          throw new BadRequestException(`Product ${line.productId} not loaded on shift`);
        }
      }

      let collected = 0;
      for (const p of payload.payments || []) {
        const amount = Math.round(Number(p.amount) || 0);
        if (amount < 0) throw new BadRequestException('Payment amount cannot be negative');
        if (amount === 0) continue;

        const payment = manager.create(Payment, {
          missionId,
          amount,
          method: p.method || PaymentMethod.CASH,
          referenceNumber: p.referenceNumber || null,
          isPartial: p.isPartial || false,
        });
        await manager.save(payment);
        collected += amount;

        const ledger = manager.create(CustomerLedger, {
          customerId: mission.customerId,
          delta: -amount,
          reason: 'payment',
          missionId,
          paymentId: payment.id,
        });
        await manager.save(ledger);
      }

      for (const r of payload.returns || []) {
        const rq = Number(r.qty);
        if (!Number.isFinite(rq) || rq <= 0) throw new BadRequestException('Invalid return qty');
        const item = mission.items?.find((i) => i.productId === r.productId);
        if (item && rq > Number(item.deliveredQty)) {
          throw new BadRequestException('Return exceeds delivered qty');
        }
        const ret = manager.create(ReturnRecord, {
          missionId,
          productId: r.productId,
          qty: rq,
          kind: r.kind,
          note: r.note || null,
        });
        await manager.save(ret);

        if (r.kind === ReturnKind.RETURN) {
          const inv = await manager
            .getRepository(ShiftInventory)
            .createQueryBuilder('inv')
            .setLock('pessimistic_write')
            .where('inv.shift_id = :shiftId AND inv.product_id = :productId', {
              shiftId: mission.shiftId,
              productId: r.productId,
            })
            .getOne();
          if (inv) {
            inv.deliveredQty = Math.max(0, Number(inv.deliveredQty) - rq);
            inv.remainingQty = Number(inv.openingQty) - Number(inv.deliveredQty);
            await manager.save(inv);
          }
        }
      }

      // Debt change = goods delivered - cash collected (net)
      // delivered increases debt; collected already reduced via payment ledger lines
      const debtDelta = deliveredAmount;
      if (debtDelta !== 0) {
        const ledger = manager.create(CustomerLedger, {
          customerId: mission.customerId,
          delta: debtDelta,
          reason: 'delivery',
          missionId,
        });
        await manager.save(ledger);
      }

      const customer = await manager.findOne(Customer, {
        where: { id: mission.customerId },
        lock: { mode: 'pessimistic_write' },
      });
      if (customer) {
        // outstanding = previous + delivered - collected
        customer.outstandingDebt = Number(customer.outstandingDebt || 0) + deliveredAmount - collected;
        await manager.save(customer);
      }

      mission.status = MissionStatus.COMPLETED;
      mission.completedAt = new Date();
      mission.deliveredAmount = deliveredAmount;
      mission.collectedAmount = collected;
      await manager.save(mission);

      const response = { mission, deliveredAmount, collected, podId: pod.id };

      if (clientOpId) {
        const key = manager.create(IdempotencyKey, {
          clientOpId,
          userId: user.id,
          endpoint: `missions/${missionId}/complete`,
          response,
          statusCode: 200,
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
        });
        await manager.save(key);
      }

      return response;
    });

    await this.audit.log({
      userId: user.id,
      userPhone: user.phone,
      userName: user.fullName,
      action: 'mission.complete',
      module: 'missions',
      entityId: missionId,
      summary: `Completed mission ${missionId}`,
      payload: { deliveredAmount: (result as any).deliveredAmount, collected: (result as any).collected },
    });

    return result;
  }
}
