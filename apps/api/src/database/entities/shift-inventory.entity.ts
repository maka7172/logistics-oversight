import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { Shift } from './shift.entity';
import { Product } from './product.entity';

@Entity('shift_inventory')
@Unique(['shiftId', 'productId'])
export class ShiftInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shift_id', type: 'uuid' })
  @Index()
  shiftId: string;

  @ManyToOne(() => Shift, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'opening_qty', type: 'int', default: 0 })
  openingQty: number;

  /** مشتق از تراکنش‌های تحویل — G3 */
  @Column({ name: 'delivered_qty', type: 'int', default: 0 })
  deliveredQty: number;

  /** opening - delivered (+ returns if restocked) — G3 */
  @Column({ name: 'remaining_qty', type: 'int', default: 0 })
  remainingQty: number;

  @Column({ name: 'physical_qty', type: 'int', nullable: true })
  physicalQty: number | null;

  @Column({ name: 'discrepancy_qty', type: 'int', nullable: true })
  discrepancyQty: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
