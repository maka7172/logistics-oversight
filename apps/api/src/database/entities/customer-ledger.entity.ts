import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_ledger')
export class CustomerLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  @Index()
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'bigint' })
  delta: number;

  @Column({ type: 'varchar', length: 100 })
  reason: string;

  @Column({ name: 'mission_id', type: 'uuid', nullable: true })
  missionId: string | null;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
