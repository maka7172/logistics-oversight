import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { InventoryLoadRecord } from './inventory-load-record.entity';
import { Product } from './product.entity';

@Entity('load_lines')
export class LoadLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId: string;

  @ManyToOne(() => InventoryLoadRecord, (r) => r.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'record_id' })
  record: InventoryLoadRecord;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  qty: number;
}
