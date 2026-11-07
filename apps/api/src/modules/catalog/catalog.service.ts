import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductUnit } from '../../database/entities/product-unit.entity';
import { Warehouse } from '../../database/entities/warehouse.entity';
import { ProductCategory } from '../../database/entities/product-category.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(ProductUnit) private unitRepo: Repository<ProductUnit>,
    @InjectRepository(Warehouse) private whRepo: Repository<Warehouse>,
    @InjectRepository(ProductCategory) private catRepo: Repository<ProductCategory>,
  ) {}

  // Units
  listUnits(activeOnly = true) {
    return this.unitRepo.find({ where: activeOnly ? { isActive: true } : {}, order: { name: 'ASC' } });
  }
  async createUnit(data: Partial<ProductUnit>) {
    if (!data.code || !data.name) throw new BadRequestException('code and name required');
    return this.unitRepo.save(this.unitRepo.create(data));
  }
  async updateUnit(id: string, data: Partial<ProductUnit>) {
    const u = await this.unitRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Unit not found');
    Object.assign(u, data);
    return this.unitRepo.save(u);
  }
  async deactivateUnit(id: string) {
    return this.updateUnit(id, { isActive: false });
  }

  // Warehouses
  listWarehouses(activeOnly = true) {
    return this.whRepo.find({ where: activeOnly ? { isActive: true } : {}, order: { name: 'ASC' } });
  }
  async createWarehouse(data: Partial<Warehouse>) {
    if (!data.code || !data.name) throw new BadRequestException('code and name required');
    return this.whRepo.save(this.whRepo.create(data));
  }
  async updateWarehouse(id: string, data: Partial<Warehouse>) {
    const w = await this.whRepo.findOne({ where: { id } });
    if (!w) throw new NotFoundException('Warehouse not found');
    Object.assign(w, data);
    return this.whRepo.save(w);
  }
  async deactivateWarehouse(id: string) {
    return this.updateWarehouse(id, { isActive: false });
  }

  // Categories
  listCategories(activeOnly = true) {
    return this.catRepo.find({ where: activeOnly ? { isActive: true } : {}, order: { name: 'ASC' } });
  }
  async createCategory(data: Partial<ProductCategory>) {
    if (!data.code || !data.name) throw new BadRequestException('code and name required');
    return this.catRepo.save(this.catRepo.create(data));
  }
  async updateCategory(id: string, data: Partial<ProductCategory>) {
    const c = await this.catRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Category not found');
    Object.assign(c, data);
    return this.catRepo.save(c);
  }
  async deactivateCategory(id: string) {
    return this.updateCategory(id, { isActive: false });
  }
}
