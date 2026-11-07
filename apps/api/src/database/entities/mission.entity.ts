import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, OneToOne, Index,
} from 'typeorm';
import { Shift } from './shift.entity';
import { Customer } from './customer.entity';
import { MissionItem } from './mission-item.entity';
import { Payment } from './payment.entity';
import { PodRecord } from './pod-record.entity';

export enum MissionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RESCHEDULED = 'rescheduled',
}

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shift_id', type: 'uuid' })
  @Index()
  shiftId: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'varchar', length: 20, default: MissionStatus.PENDING })
  @Index()
  status: MissionStatus;

  @Column({ name: 'seq', type: 'int', default: 0 })
  seq: number;

  @Column({ name: 'planned_amount', type: 'bigint', default: 0 })
  plannedAmount: number;

  @Column({ name: 'delivered_amount', type: 'bigint', default: 0 })
  deliveredAmount: number;

  @Column({ name: 'collected_amount', type: 'bigint', default: 0 })
  collectedAmount: number;

  @Column({ name: 'arrival_at', type: 'timestamptz', nullable: true })
  arrivalAt: Date | null;

  @Column({ name: 'arrival_lat', type: 'double precision', nullable: true })
  arrivalLat: number | null;

  @Column({ name: 'arrival_lng', type: 'double precision', nullable: true })
  arrivalLng: number | null;

  @Column({ name: 'arrival_distance_m', type: 'float', nullable: true })
  arrivalDistanceM: number | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'fail_reason', type: 'text', nullable: true })
  failReason: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @OneToMany(() => MissionItem, (i) => i.mission, { cascade: true })
  items: MissionItem[];

  @OneToMany(() => Payment, (p) => p.mission, { cascade: true })
  payments: Payment[];

  @OneToOne(() => PodRecord, (p) => p.mission)
  pod: PodRecord;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
