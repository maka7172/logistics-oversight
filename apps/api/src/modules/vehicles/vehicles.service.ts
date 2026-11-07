import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { VehicleType } from '../../database/entities/vehicle-type.entity';
import { Driver } from '../../database/entities/driver.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(VehicleType) private typeRepo: Repository<VehicleType>,
    @InjectRepository(Driver) private driverRepo: Repository<Driver>,
  ) {}

  listTypes(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};
    return this.typeRepo.find({ where, order: { name: 'ASC' } });
  }

  async createType(data: Partial<VehicleType>) {
    if (!data.code) {
      const last = await this.typeRepo.createQueryBuilder('t').orderBy('t.code', 'DESC').getOne();
      let n = 1;
      if (last?.code) {
        const m = String(last.code).match(/(\d+)$/);
        if (m) n = parseInt(m[1], 10) + 1;
      }
      data.code = `VT-${String(n).padStart(3, '0')}`;
    }
    return this.typeRepo.save(this.typeRepo.create(data));
  }

  async updateType(id: string, data: Partial<VehicleType>) {
    const t = await this.typeRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Vehicle type not found');
    if (data.name !== undefined) t.name = data.name;
    if (data.nameEn !== undefined) t.nameEn = data.nameEn;
    if (data.description !== undefined) t.description = data.description;
    if (data.isActive !== undefined) t.isActive = data.isActive;
    // code immutable
    return this.typeRepo.save(t);
  }

  listVehicles(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};
    return this.vehicleRepo.find({ where, order: { plateNumber: 'ASC' } });
  }

  /** Vehicles not assigned to any active driver */
  async listAvailable() {
    const assigned = await this.driverRepo
      .createQueryBuilder('d')
      .select('d.assigned_vehicle_id')
      .where('d.assigned_vehicle_id IS NOT NULL')
      .andWhere('d.is_active = true')
      .getRawMany();
    const ids = assigned.map((r) => r.assigned_vehicle_id).filter(Boolean);
    const qb = this.vehicleRepo.createQueryBuilder('v').where('v.is_active = true');
    if (ids.length) qb.andWhere('v.id NOT IN (:...ids)', { ids });
    return qb.orderBy('v.plate_number', 'ASC').getMany();
  }

  async getVehicle(id: string) {
    const v = await this.vehicleRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  async createVehicle(data: Partial<Vehicle>) {
    if (!data.plateNumber) throw new BadRequestException('plateNumber required');
    return this.vehicleRepo.save(this.vehicleRepo.create(data));
  }

  async updateVehicle(id: string, data: Partial<Vehicle>) {
    const v = await this.getVehicle(id);
    if (data.vehicleTypeId !== undefined) v.vehicleTypeId = data.vehicleTypeId;
    if (data.brand !== undefined) v.brand = data.brand;
    if (data.model !== undefined) v.model = data.model;
    if (data.color !== undefined) v.color = data.color;
    if (data.capacityNote !== undefined) v.capacityNote = data.capacityNote;
    if (data.isActive !== undefined) v.isActive = data.isActive;
    // plateNumber treated as code-like identity — allow change carefully but keep history via soft delete preferred
    if (data.plateNumber !== undefined) v.plateNumber = data.plateNumber;
    return this.vehicleRepo.save(v);
  }

  async softDelete(id: string) {
    const v = await this.getVehicle(id);
    const inUse = await this.driverRepo.findOne({
      where: { assignedVehicleId: id, isActive: true },
    });
    if (inUse) throw new BadRequestException('Vehicle assigned to a driver. Revoke first.');
    v.isActive = false;
    return this.vehicleRepo.save(v);
  }
}
