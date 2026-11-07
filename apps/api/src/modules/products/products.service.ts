import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { ProductUnit } from '../../database/entities/product-unit.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(ShiftInventory) private invRepo: Repository<ShiftInventory>,
    @InjectRepository(ProductUnit) private unitRepo: Repository<ProductUnit>,
    private dataSource: DataSource,
  ) {}

  findAll(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, order: { code: 'ASC' } });
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  /** Generate next sequential code: PRD-0001, PRD-0002, ... */
  async nextCode(): Promise<string> {
    const last = await this.repo
      .createQueryBuilder('p')
      .orderBy('p.code', 'DESC')
      .getOne();
    let n = 1;
    if (last?.code) {
      const m = last.code.match(/(\d+)$/);
      if (m) n = parseInt(m[1], 10) + 1;
    }
    return `PRD-${String(n).padStart(4, '0')}`;
  }

  async create(data: {
    name: string;
    nameEn?: string;
    unitId?: string;
    warehouseId?: string;
    categoryId?: string;
    barcode?: string;
    defaultPrice?: number;
  }) {
    if (!data.name) throw new BadRequestException('name required');
    const code = await this.nextCode();
    let unitStr = 'unit';
    if (data.unitId) {
      const u = await this.unitRepo.findOne({ where: { id: data.unitId } });
      if (u) unitStr = u.code;
    }
    const p = this.repo.create({
      code,
      name: data.name,
      nameEn: data.nameEn || null,
      unitId: data.unitId || null,
      unit: unitStr,
      warehouseId: data.warehouseId || null,
      categoryId: data.categoryId || null,
      barcode: data.barcode || null,
      defaultPrice: data.defaultPrice || 0,
      isActive: true,
    });
    return this.repo.save(p);
  }

  async update(id: string, data: Partial<Product> & { unitId?: string; warehouseId?: string; categoryId?: string }) {
    const p = await this.findOne(id);
    if (data.name !== undefined) p.name = data.name;
    if (data.nameEn !== undefined) p.nameEn = data.nameEn;
    if (data.unitId !== undefined) {
      p.unitId = data.unitId;
      if (data.unitId) {
        const u = await this.unitRepo.findOne({ where: { id: data.unitId } });
        if (u) p.unit = u.code;
      }
    }
    if (data.warehouseId !== undefined) p.warehouseId = data.warehouseId;
    if (data.categoryId !== undefined) p.categoryId = data.categoryId;
    if (data.barcode !== undefined) p.barcode = data.barcode;
    if (data.defaultPrice !== undefined) p.defaultPrice = data.defaultPrice as any;
    if (data.isActive !== undefined) p.isActive = data.isActive;
    return this.repo.save(p);
  }

  /** Has any inventory movement / remaining? */
  async hasInventory(productId: string): Promise<boolean> {
    const row = await this.invRepo
      .createQueryBuilder('i')
      .where('i.product_id = :productId', { productId })
      .andWhere('(i.opening_qty > 0 OR i.delivered_qty > 0 OR i.remaining_qty > 0)')
      .getOne();
    return !!row;
  }

  async softDelete(id: string) {
    await this.findOne(id);
    if (await this.hasInventory(id)) {
      throw new BadRequestException('Cannot delete product with inventory. Transfer to another product first.');
    }
    await this.repo.update(id, { isActive: false });
    return { success: true };
  }

  /** Transfer inventory references from source product to target product, then deactivate source */
  async transfer(fromId: string, toId: string) {
    if (fromId === toId) throw new BadRequestException('Source and target must differ');
    const from = await this.findOne(fromId);
    const to = await this.findOne(toId);
    if (!to.isActive) throw new BadRequestException('Target product is inactive');

    return this.dataSource.transaction(async (manager) => {
      // Merge shift_inventory rows
      const rows = await manager.find(ShiftInventory, { where: { productId: fromId } });
      for (const row of rows) {
        let target = await manager.findOne(ShiftInventory, {
          where: { shiftId: row.shiftId, productId: toId },
        });
        if (target) {
          target.openingQty += row.openingQty;
          target.deliveredQty += row.deliveredQty;
          target.remainingQty = target.openingQty - target.deliveredQty;
          await manager.save(target);
          await manager.remove(row);
        } else {
          row.productId = toId;
          await manager.save(row);
        }
      }
      from.isActive = false;
      await manager.save(from);
      return { success: true, from: from.code, to: to.code };
    });
  }
}
