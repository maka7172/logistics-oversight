import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { Driver } from './driver.entity';
import { Vehicle } from './vehicle.entity';

export enum ShiftStatus {
  PENDING = 'pending',
  READY = 'ready',
  ACTIVE = 'active',
  CLOSING = 'closing',
  CLOSED = 'closed',
}

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'driver_id', type: 'uuid' })
  @Index()
  driverId: string;

  @ManyToOne(() => Driver, { eager: true })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId: string | null;

  @ManyToOne(() => Vehicle, { nullable: true, eager: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle | null;

  @Column({ type: 'varchar', length: 20, default: ShiftStatus.PENDING })
  @Index()
  status: ShiftStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'opening_cash_float', type: 'bigint', default: 0 })
  openingCashFloat: number;

  @Column({ name: 'closing_cash_reported', type: 'bigint', nullable: true })
  closingCashReported: number | null;

  @Column({ name: 'expected_cash', type: 'bigint', nullable: true })
  expectedCash: number | null;

  @Column({ name: 'cash_discrepancy', type: 'bigint', nullable: true })
  cashDiscrepancy: number | null;

  @Column({ name: 'discrepancy_note', type: 'text', nullable: true })
  discrepancyNote: string | null;

  @Column({ name: 'inventory_approved_by', type: 'uuid', nullable: true })
  inventoryApprovedBy: string | null;

  @Column({ name: 'inventory_approved_at', type: 'timestamptz', nullable: true })
  inventoryApprovedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
