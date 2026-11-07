import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Driver } from '../../database/entities/driver.entity';
import { User } from '../../database/entities/user.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver) private repo: Repository<Driver>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Vehicle) private vehicleRepo: Repository<Vehicle>,
  ) {}

  findAll(activeOnly = true) {
    const where: any = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const d = await this.repo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Driver not found');
    return d;
  }

  async findByUserId(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  /** Ensure vehicle not assigned to another active driver */
  private async assertVehicleFree(vehicleId: string | null | undefined, exceptDriverId?: string) {
    if (!vehicleId) return;
    const qb = this.repo
      .createQueryBuilder('d')
      .where('d.assigned_vehicle_id = :vehicleId', { vehicleId })
      .andWhere('d.is_active = true');
    if (exceptDriverId) qb.andWhere('d.id != :exceptDriverId', { exceptDriverId });
    const other = await qb.getOne();
    if (other) {
      throw new BadRequestException('Vehicle already assigned to another driver. Revoke first.');
    }
  }

  async create(data: {
    userId: string;
    personnelCode?: string;
    assignedVehicleId?: string;
    driverRoleLabel?: string;
    preferredVehicleTypeId?: string;
    licenseNumber?: string;
  }) {
    const user = await this.userRepo.findOne({ where: { id: data.userId } });
    if (!user) throw new BadRequestException('User not found');
    const existing = await this.repo.findOne({ where: { userId: data.userId } });
    if (existing) throw new BadRequestException('Driver already exists for this user');

    await this.assertVehicleFree(data.assignedVehicleId);

    const d = this.repo.create({
      userId: data.userId,
      personnelCode: data.personnelCode || null,
      assignedVehicleId: data.assignedVehicleId || null,
      driverRoleLabel: data.driverRoleLabel || null,
      preferredVehicleTypeId: data.preferredVehicleTypeId || null,
      licenseNumber: data.licenseNumber || null,
      isActive: true,
    });
    return this.repo.save(d);
  }

  async update(id: string, data: Partial<Driver> & { assignedVehicleId?: string | null }) {
    const d = await this.findOne(id);
    if (data.assignedVehicleId !== undefined) {
      await this.assertVehicleFree(data.assignedVehicleId, id);
      d.assignedVehicleId = data.assignedVehicleId;
    }
    if (data.personnelCode !== undefined) d.personnelCode = data.personnelCode as any;
    if (data.driverRoleLabel !== undefined) d.driverRoleLabel = data.driverRoleLabel as any;
    if (data.preferredVehicleTypeId !== undefined) d.preferredVehicleTypeId = data.preferredVehicleTypeId as any;
    if (data.licenseNumber !== undefined) d.licenseNumber = data.licenseNumber as any;
    if (data.isActive !== undefined) d.isActive = data.isActive as any;
    return this.repo.save(d);
  }

  /** Revoke vehicle from driver */
  async revokeVehicle(id: string) {
    const d = await this.findOne(id);
    d.assignedVehicleId = null;
    return this.repo.save(d);
  }

  /** Soft deactivate */
  async softDelete(id: string) {
    const d = await this.findOne(id);
    d.isActive = false;
    d.assignedVehicleId = null;
    return this.repo.save(d);
  }
}
