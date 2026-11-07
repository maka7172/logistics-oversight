import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Mission } from './mission.entity';
import { Product } from './product.entity';

export enum ReturnKind {
  RETURN = 'return',
  DAMAGED = 'damaged',
}

@Entity('returns')
export class ReturnRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mission_id', type: 'uuid' })
  @Index()
  missionId: string;

  @ManyToOne(() => Mission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'varchar', length: 20 })
  kind: ReturnKind;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
