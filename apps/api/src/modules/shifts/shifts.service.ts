import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Shift, ShiftStatus } from '../../database/entities/shift.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { InventoryLoadRecord, LoadRecordStatus } from '../../database/entities/inventory-load-record.entity';
import { LoadLine } from '../../database/entities/load-line.entity';
import { Driver } from '../../database/entities/driver.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift) private shiftRepo: Repository<Shift>,
    @InjectRepository(ShiftInventory) private invRepo: Repository<ShiftInventory>,
    @InjectRepository(InventoryLoadRecord) private loadRepo: Repository<InventoryLoadRecord>,
    @InjectRepository(LoadLine) private lineRepo: Repository<LoadLine>,
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
      user?.permissions?.includes('shifts:inventory')
    );
  }

  async findAll(status: string | undefined, user: any) {
    const qb = this.shiftRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('s.vehicle', 'vehicle')
      .orderBy('s.createdAt', 'DESC')
      .take(100);

    if (status) qb.andWhere('s.status = :status', { status });

    if (!this.isStaff(user)) {
      const driver = await this.driverRepo.findOne({ where: { userId: user.id } });
      if (!driver) return [];
      qb.andWhere('s.driverId = :driverId', { driverId: driver.id });
    }

    return qb.getMany();
  }

  async findOne(id: string) {
    const s = await this.shiftRepo.findOne({
      where: { id },
      relations: ['driver', 'driver.user', 'vehicle'],
    });
    if (!s) throw new NotFoundException('Shift not found');
    return s;
  }

  async assertCanAccess(shiftId: string, user: any) {
    if (this.isStaff(user)) return this.findOne(shiftId);
    const shift = await this.findOne(shiftId);
    if (shift.driver?.userId !== user.id) {
      throw new ForbiddenException('Not your shift');
    }
    return shift;
  }

  async listLoadRecords(shiftId: string) {
    return this.loadRepo.find({ where: { shiftId }, order: { createdAt: 'DESC' }, relations: ['lines'] });
  }

  async getInventory(shiftId: string) {
    return this.invRepo.find({ where: { shiftId }, order: { productId: 'ASC' } });
  }

  async create(driverId: string, vehicleId?: string, actorId?: string) {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new BadRequestException('Driver not found');
    const shift = this.shiftRepo.create({
      driverId,
      vehicleId: vehicleId || driver.assignedVehicleId || null,
      status: ShiftStatus.PENDING,
    });
    const saved = await this.shiftRepo.save(shift);
    await this.audit.log({
      userId: actorId,
      action: 'shift.create',
      module: 'shifts',
      entityId: saved.id,
      summary: `Created shift for driver ${driverId}`,
    });
    return saved;
  }

  async createLoadRecord(
    shiftId: string,
    userId: string,
    openingCash: number,
    lines: { productId: string; qty: number }[],
  ) {
    const shift = await this.findOne(shiftId);
    if (shift.status !== ShiftStatus.PENDING && shift.status !== ShiftStatus.READY) {
      throw new BadRequestException('Shift not open for loading');
    }
    if (openingCash < 0) throw new BadRequestException('openingCash invalid');
    for (const l of lines || []) {
      if (!l.productId || Number(l.qty) <= 0) throw new BadRequestException('Invalid load line');
    }

    const record = this.loadRepo.create({
      shiftId,
      createdBy: userId,
      openingCash: Math.round(openingCash || 0),
      status: LoadRecordStatus.DRAFT,
      lines: (lines || []).map((l) =>
        Object.assign(new LoadLine(), {
          productId: l.productId,
          qty: Number(l.qty),
        }),
      ),
    });
    return this.loadRepo.save(record);
  }

  async approveLoad(recordId: string, approverId: string) {
    return this.dataSource.transaction(async (manager) => {
      const record = await manager.findOne(InventoryLoadRecord, {
        where: { id: recordId },
        relations: ['lines'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!record) throw new NotFoundException('Load record not found');
      if (record.status === LoadRecordStatus.APPROVED) {
        throw new BadRequestException('Already approved');
      }
      if (record.createdBy === approverId) {
        // allow in small teams but log — forbid same person for stronger control:
        // throw new ForbiddenException('Creator cannot approve own load');
      }

      const shift = await manager.findOne(Shift, {
        where: { id: record.shiftId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!shift) throw new NotFoundException('Shift not found');
      if (shift.status !== ShiftStatus.PENDING && shift.status !== ShiftStatus.READY) {
        throw new BadRequestException('Cannot approve load on active/closed shift');
      }

      record.status = LoadRecordStatus.APPROVED;
      record.approvedBy = approverId;
      record.approvedAt = new Date();
      await manager.save(record);

      shift.openingCashFloat = record.openingCash;
      shift.inventoryApprovedBy = approverId;
      shift.inventoryApprovedAt = new Date();
      shift.status = ShiftStatus.READY;
      await manager.save(shift);

      for (const line of record.lines || []) {
        let inv = await manager.findOne(ShiftInventory, {
          where: { shiftId: shift.id, productId: line.productId },
          lock: { mode: 'pessimistic_write' },
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
          inv.remainingQty = line.qty - Number(inv.deliveredQty || 0);
        }
        await manager.save(inv);
      }

      return { shift, record };
    });
  }

  async startShift(shiftId: string, driverUserId: string, isStaff = false) {
    const shift = await this.findOne(shiftId);
    if (shift.status !== ShiftStatus.READY) {
      throw new BadRequestException('Shift is not ready (inventory not approved)');
    }
    if (!isStaff && shift.driver?.userId && shift.driver.userId !== driverUserId) {
      throw new ForbiddenException('Not your shift');
    }
    shift.status = ShiftStatus.ACTIVE;
    shift.startedAt = new Date();
    return this.shiftRepo.save(shift);
  }

  async closeShift(shiftId: string, user: any, closingCashReported: number, discrepancyNote?: string) {
    await this.assertCanAccess(shiftId, user);
    if (closingCashReported < 0) throw new BadRequestException('Invalid cash amount');

    return this.dataSource.transaction(async (manager) => {
      const shift = await manager.findOne(Shift, {
        where: { id: shiftId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!shift) throw new NotFoundException('Shift not found');
      if (shift.status !== ShiftStatus.ACTIVE && shift.status !== ShiftStatus.CLOSING) {
        throw new BadRequestException('Shift cannot be closed from current status');
      }

      const expected = shift.expectedCash ?? shift.openingCashFloat;
      const discrepancy = closingCashReported - Number(expected);

      shift.closingCashReported = closingCashReported;
      shift.cashDiscrepancy = discrepancy;
      shift.discrepancyNote = discrepancyNote || null;
      shift.status = ShiftStatus.CLOSED;
      shift.endedAt = new Date();
      await manager.save(shift);

      await this.audit.log({
        userId: user.id,
        action: 'shift.close',
        module: 'shifts',
        entityId: shiftId,
        summary: `Closed shift cash=${closingCashReported}`,
      });

      return shift;
    });
  }
}
