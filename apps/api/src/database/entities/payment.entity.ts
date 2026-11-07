import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Mission } from './mission.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  CHECK = 'check',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mission_id', type: 'uuid' })
  missionId: string;

  @ManyToOne(() => Mission, (m) => m.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  method: PaymentMethod;

  @Column({ name: 'reference_number', type: 'varchar', length: 100, nullable: true })
  referenceNumber: string | null;

  @Column({ name: 'is_partial', type: 'boolean', default: false })
  isPartial: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
