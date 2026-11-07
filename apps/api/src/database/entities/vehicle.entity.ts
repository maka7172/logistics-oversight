import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { VehicleType } from './vehicle-type.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plate_number', type: 'varchar', length: 30, unique: true })
  @Index()
  plateNumber: string;

  @Column({ name: 'vehicle_type_id', type: 'uuid', nullable: true })
  vehicleTypeId: string | null;

  @ManyToOne(() => VehicleType, (t) => t.vehicles, { nullable: true, eager: true })
  @JoinColumn({ name: 'vehicle_type_id' })
  vehicleType: VehicleType | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ name: 'color', type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ name: 'capacity_note', type: 'varchar', length: 200, nullable: true })
  capacityNote: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
