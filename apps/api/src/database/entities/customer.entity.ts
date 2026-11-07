import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  @Index()
  code: string | null;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'credit_limit', type: 'bigint', default: 0 })
  creditLimit: number;

  /** بدهی از دفتر محاسبه می‌شود؛ این فیلد کش/خلاصه است */
  @Column({ name: 'outstanding_debt', type: 'bigint', default: 0 })
  outstandingDebt: number;

  @Column({ name: 'location_lat', type: 'double precision', nullable: true })
  locationLat: number | null;

  @Column({ name: 'location_lng', type: 'double precision', nullable: true })
  locationLng: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
