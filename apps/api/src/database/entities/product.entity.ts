import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ProductUnit } from './product-unit.entity';
import { Warehouse } from './warehouse.entity';
import { ProductCategory } from './product-category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'name_en', type: 'varchar', length: 200, nullable: true })
  nameEn: string | null;

  @Column({ name: 'unit_id', type: 'uuid', nullable: true })
  unitId: string | null;

  @ManyToOne(() => ProductUnit, { nullable: true, eager: true })
  @JoinColumn({ name: 'unit_id' })
  unitRef: ProductUnit | null;

  /** legacy string unit kept for compatibility */
  @Column({ type: 'varchar', length: 50, default: 'unit' })
  unit: string;

  @Column({ name: 'warehouse_id', type: 'uuid', nullable: true })
  warehouseId: string | null;

  @ManyToOne(() => Warehouse, { nullable: true, eager: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => ProductCategory, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  categoryRef: ProductCategory | null;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ name: 'barcode', type: 'varchar', length: 64, nullable: true })
  barcode: string | null;

  @Column({ name: 'default_price', type: 'bigint', default: 0 })
  defaultPrice: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
