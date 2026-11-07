import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { Shift } from './shift.entity';

@Entity('location_pings')
export class LocationPing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'driver_id', type: 'uuid' })
  @Index()
  driverId: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ name: 'shift_id', type: 'uuid', nullable: true })
  @Index()
  shiftId: string | null;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ type: 'float', nullable: true })
  speed: number | null;

  @Column({ type: 'float', nullable: true })
  heading: number | null;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  @Index()
  recordedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
