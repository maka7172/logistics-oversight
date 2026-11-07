import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'device_id', type: 'varchar', length: 100, unique: true })
  @Index()
  deviceId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ name: 'os_version', type: 'varchar', length: 50, nullable: true })
  osVersion: string | null;

  @Column({ name: 'app_version', type: 'varchar', length: 50, nullable: true })
  appVersion: string | null;

  @Column({ name: 'push_token', type: 'text', nullable: true })
  pushToken: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
