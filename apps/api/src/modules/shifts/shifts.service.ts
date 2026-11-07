import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Shift, ShiftStatus } from '../../database/entities/shift.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { InventoryLoadRecord, LoadRecordStatus } from '../../database/entities/inventory-load-record.entity';
import { LoadLine } from '../../database/entities/load-line.entity';
import { Driver } from '../../database/entities/driver.entity';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift) private shiftRepo: Repository<Shift>,
    @InjectRepository(ShiftInventory) private invRepo: Repository<ShiftInventory>,
    @InjectRepository(InventoryLoadRecord) private loadRepo: Repository<InventoryLoadRecord>,
    @InjectRepository(LoadLine) private lineRepo: Repository<LoadLine>,
    @InjectRepository(Driver) private driverRepo: Repository<Driver>,
    private dataSource: DataSource,
  ) {}

  findAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.shiftRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
      relations: ['driver', 'driver.user', 'vehicle'],
    });
  }

  async findOne(id: string) {
    const s = await this.shiftRepo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Shift not found');
    return s;
  }

  async listLoadRecords(shiftId: string) {
    return this.loadRepo.find({ where: { shiftId }, order: { createdAt: 'DESC' }, relations: ['lines'] });
  }

  async getInventory(shiftId: string) {
    return this.invRepo.find({ where: { shiftId }, order: { productId: 'ASC' } });
  }

  /** ایجاد شیفت برای راننده */
  async create(driverId: string, vehicleId?: string) {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new BadRequestException('Driver not found');
    const shift = this.shiftRepo.create({
      driverId,
      vehicleId: vehicleId || driver.assignedVehicleId || null,
      status: ShiftStatus.PENDING,
    });
    return this.shiftRepo.save(shift);
  }

  /** ثبت بار اولیه توسط ناظر (G1) */
  async createLoadRecord(shiftId: string, userId: string, openingCash: number, lines: { productId: string; qty: number }[]) {
    const shift = await this.findOne(shiftId);
    if (shift.status !== ShiftStatus.PENDING && shift.status !== ShiftStatus.READY) {
      throw new BadRequestException('Shift not open for loading');
    }
    const record = this.loadRepo.create({
      shiftId,
      createdBy: userId,
      openingCash,
      status: LoadRecordStatus.DRAFT,
      lines: lines.map((l) => this.lineRepo.create({ productId: l.productId, qty: l.qty })),
    });
    return this.loadRepo.save(record);
  }

  /** تأیید نهایی بار — approved_by (G1) و آماده‌سازی shift_inventory */
  async approveLoad(recordId: string, approverId: string) {
    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(InventoryLoadRecord, {
        where: { id: recordId },
        relations: ['lines'],
      });
      if (!record) throw new NotFoundException('Load record not found');
      if (record.status === LoadRecordStatus.APPROVED) {
        throw new BadRequestException('Already approved');
      }

      record.status = LoadRecordStatus.APPROVED;
      record.approvedBy = approverId;
      record.approvedAt = new Date();
      await manager.save(record);

      const shift = await manager.findOne(Shift, { where: { id: record.shiftId } });
      if (!shift) throw new NotFoundException('Shift not found');

      shift.openingCashFloat = record.openingCash;
      shift.inventoryApprovedBy = approverId;
      shift.inventoryApprovedAt = new Date();
      shift.status = ShiftStatus.READY;
      await manager.save(shift);

      // Build shift_inventory from lines
      for (const line of record.lines || []) {
        let inv = await manager.findOne(ShiftInventory, {
          where: { shiftId: shift.id, productId: line.productId },
        });
        if (!inv) {
          inv = manager.create(ShiftInventory, {
            shiftId: shift.id,
            productId: line.productId,
            openingQty: line.qty,
            deliveredQty: 0,
            remainingQty: line.qty,
          });
        } else {
          inv.openingQty = line.qty;
          inv.remainingQty = line.qty - inv.deliveredQty;
        }
        await manager.save(inv);
      }

      return { shift, record };
    });
  }

  /** راننده شیفت را شروع می‌کند */
  async startShift(shiftId: string, driverUserId: string) {
    const shift = await this.findOne(shiftId);
    if (shift.status !== ShiftStatus.READY) {
      throw new BadRequestException('Shift is not ready (inventory not approved)');
    }
    if (shift.driver?.userId && shift.driver.userId !== driverUserId) {
      // soft check — allow if super admin later
    }
    shift.status = ShiftStatus.ACTIVE;
    shift.startedAt = new Date();
    return this.shiftRepo.save(shift);
  }

  /** بستن شیفت با ثبت نقد و مغایرت */
  async closeShift(shiftId: string, closingCashReported: number, discrepancyNote?: string) {
    return this.dataSource.transaction(async (manager) => {
      const shift = await manager.findOne(Shift, { where: { id: shiftId } });
      if (!shift) throw new NotFoundException('Shift not found');
      if (shift.status !== ShiftStatus.ACTIVE && shift.status !== ShiftStatus.CLOSING) {
        throw new BadRequestException('Shift cannot be closed from current status');
      }

      // expected cash ≈ opening + sum of cash payments (simplified; full calc in missions later)
      const expected = shift.expectedCash ?? shift.openingCashFloat;
      const discrepancy = closingCashReported - Number(expected);

      shift.closingCashReported = closingCashReported;
      shift.cashDiscrepancy = discrepancy;
      shift.discrepancyNote = discrepancyNote || null;
      shift.status = ShiftStatus.CLOSED;
      shift.endedAt = new Date();
      await manager.save(shift);

      return shift;
    });
  }
}
