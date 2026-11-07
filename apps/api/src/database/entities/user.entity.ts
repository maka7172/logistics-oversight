import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Device } from './device.entity';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Column({ name: 'personnel_code', type: 'varchar', length: 50, nullable: true, unique: true })
  personnelCode: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_super_admin', type: 'boolean', default: false })
  isSuperAdmin: boolean;

  @Column({ name: 'preferred_locale', type: 'varchar', length: 10, default: 'fa' })
  preferredLocale: string;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @ManyToMany(() => Role, (role) => role.users, { eager: true, cascade: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
