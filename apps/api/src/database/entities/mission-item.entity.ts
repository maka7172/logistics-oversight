import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Mission } from './mission.entity';
import { Product } from './product.entity';

@Entity('mission_items')
export class MissionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mission_id', type: 'uuid' })
  missionId: string;

  @ManyToOne(() => Mission, (m) => m.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'ordered_qty', type: 'int', default: 0 })
  orderedQty: number;

  @Column({ name: 'delivered_qty', type: 'int', default: 0 })
  deliveredQty: number;

  @Column({ name: 'unit_price', type: 'bigint', default: 0 })
  unitPrice: number;

  @Column({ name: 'line_total', type: 'bigint', default: 0 })
  lineTotal: number;
}
