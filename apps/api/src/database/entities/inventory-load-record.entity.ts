import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { Shift } from './shift.entity';
import { User } from './user.entity';
import { LoadLine } from './load-line.entity';

export enum LoadRecordStatus {
  DRAFT = 'draft',
  FINALIZED = 'finalized',
  APPROVED = 'approved',
}

@Entity('inventory_load_records')
export class InventoryLoadRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shift_id', type: 'uuid' })
  @Index()
  shiftId: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User | null;

  @Column({ type: 'varchar', length: 20, default: LoadRecordStatus.DRAFT })
  status: LoadRecordStatus;

  @Column({ name: 'opening_cash', type: 'bigint', default: 0 })
  openingCash: number;

  @OneToMany(() => LoadLine, (l) => l.record, { cascade: true, eager: true })
  lines: LoadLine[];

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
