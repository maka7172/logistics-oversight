import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn, ManyToOne, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';
import { VehicleType } from './vehicle-type.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'personnel_code', type: 'varchar', length: 50, nullable: true, unique: true })
  @Index()
  personnelCode: string | null;

  @Column({ name: 'assigned_vehicle_id', type: 'uuid', nullable: true })
  assignedVehicleId: string | null;

  @ManyToOne(() => Vehicle, { nullable: true, eager: true })
  @JoinColumn({ name: 'assigned_vehicle_id' })
  assignedVehicle: Vehicle | null;

  /** نقش/تخصص اختیاری راننده — مثلاً راننده موتور، راننده وانت (آزاد) */
  @Column({ name: 'driver_role_label', type: 'varchar', length: 100, nullable: true })
  driverRoleLabel: string | null;

  @Column({ name: 'preferred_vehicle_type_id', type: 'uuid', nullable: true })
  preferredVehicleTypeId: string | null;

  @ManyToOne(() => VehicleType, { nullable: true, eager: true })
  @JoinColumn({ name: 'preferred_vehicle_type_id' })
  preferredVehicleType: VehicleType | null;

  @Column({ name: 'license_number', type: 'varchar', length: 50, nullable: true })
  licenseNumber: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
