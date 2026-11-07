import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string | null;

  @Column({ name: 'user_phone', type: 'varchar', length: 20, nullable: true })
  userPhone: string | null;

  @Column({ name: 'user_name', type: 'varchar', length: 150, nullable: true })
  userName: string | null;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  action: string; // create | update | delete | login | transfer | ...

  @Column({ type: 'varchar', length: 50 })
  @Index()
  module: string; // products | users | shifts | ...

  @Column({ name: 'entity_id', type: 'varchar', length: 64, nullable: true })
  entityId: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any> | null;

  @Column({ name: 'ip', type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index()
  createdAt: Date;
}
