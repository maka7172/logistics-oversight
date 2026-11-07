import {
  Entity, PrimaryColumn, Column, CreateDateColumn, Index
} from 'typeorm';

@Entity('idempotency_keys')
export class IdempotencyKey {
  @PrimaryColumn({ name: 'client_op_id', type: 'uuid' })
  clientOpId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'endpoint' })
  endpoint: string;

  @Column({ type: 'jsonb', nullable: true })
  response: any;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  @Index()
  expiresAt: Date;
}
