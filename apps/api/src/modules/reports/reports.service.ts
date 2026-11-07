import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift, ShiftStatus } from '../../database/entities/shift.entity';
import { Mission, MissionStatus } from '../../database/entities/mission.entity';
import { Driver } from '../../database/entities/driver.entity';
import { Product } from '../../database/entities/product.entity';
import { Customer } from '../../database/entities/customer.entity';
import { LocationPing } from '../../database/entities/location-ping.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { Payment } from '../../database/entities/payment.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Shift) private shiftRepo: Repository<Shift>,
    @InjectRepository(Mission) private missionRepo: Repository<Mission>,
    @InjectRepository(Driver) private driverRepo: Repository<Driver>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(LocationPing) private pingRepo: Repository<LocationPing>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    @InjectRepository(ShiftInventory) private invRepo: Repository<ShiftInventory>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
  ) {}

  async dashboard() {
    const [shiftsActive, shiftsToday, missionsOpen, missionsDone, drivers, customers, products] =
      await Promise.all([
        this.shiftRepo.count({ where: { status: ShiftStatus.ACTIVE } }),
        this.shiftRepo.count(),
        this.missionRepo.count({ where: { status: MissionStatus.IN_PROGRESS } }),
        this.missionRepo.count({ where: { status: MissionStatus.COMPLETED } }),
        this.driverRepo.count({ where: { isActive: true } }),
        this.customerRepo.count(),
        this.productRepo.count(),
      ]);

    const payments = await this.paymentRepo.find({ take: 500, order: { createdAt: 'DESC' } });
    const totalCash = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

    return {
      shiftsActive,
      shiftsTotal: shiftsToday,
      missionsOpen,
      missionsDone,
      driversActive: drivers,
      customers,
      products,
      paymentsTotal: totalCash,
      paymentsCount: payments.length,
    };
  }

  async shiftsReport() {
    return this.shiftRepo.find({
      order: { createdAt: 'DESC' },
      take: 200,
      relations: ['driver', 'driver.user', 'vehicle'],
    });
  }

  async missionsReport() {
    return this.missionRepo.find({
      order: { createdAt: 'DESC' },
      take: 300,
      relations: ['customer', 'items', 'payments', 'pod'],
    });
  }

  inventoryByShift(shiftId: string) {
    return this.invRepo.find({ where: { shiftId }, order: { productId: 'ASC' } });
  }

  async liveDrivers() {
    const drivers = await this.driverRepo.find({
      where: { isActive: true },
      relations: ['user'],
    });
    const result: any[] = [];
    for (const d of drivers) {
      const ping = await this.pingRepo.findOne({
        where: { driverId: d.id },
        order: { recordedAt: 'DESC' },
      });
      const activeShift = await this.shiftRepo.findOne({
        where: { driverId: d.id, status: ShiftStatus.ACTIVE },
      });
      result.push({
        driverId: d.id,
        fullName: (d as any).user?.fullName || d.id,
        phone: (d as any).user?.phone || null,
        driverRoleLabel: (d as any).driverRoleLabel || null,
        lastLocation: ping
          ? {
              lat: ping.lat,
              lng: ping.lng,
              speed: ping.speed,
              heading: ping.heading,
              recordedAt: ping.recordedAt,
            }
          : null,
        activeShiftId: activeShift?.id || null,
        shiftStatus: activeShift?.status || null,
      });
    }
    return result;
  }

  async postPing(data: {
    driverId?: string;
    userId?: string;
    shiftId?: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    recordedAt?: string;
  }) {
    let driverId = data.driverId;
    if (!driverId && data.userId) {
      const d = await this.driverRepo.findOne({ where: { userId: data.userId } });
      driverId = d?.id;
    }
    // last resort: if only one active driver linked somehow — skip
    if (!driverId) {
      // store is useless without driver; ignore silently for app stability
      return { ok: false, reason: 'driverId required' };
    }
    const row = this.pingRepo.create({
      driverId,
      shiftId: data.shiftId || null,
      lat: Number(data.lat),
      lng: Number(data.lng),
      speed: data.speed ?? null,
      heading: data.heading ?? null,
      recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
    });
    const saved = await this.pingRepo.save(row);
    return { ok: true, id: saved.id, driverId: saved.driverId, lat: saved.lat, lng: saved.lng };
  }

  async audit(take = 200) {
    return this.auditRepo.find({ order: { createdAt: 'DESC' }, take });
  }
}
