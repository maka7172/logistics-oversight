import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { Mission } from './mission.entity';

@Entity('pod_records')
export class PodRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mission_id', type: 'uuid', unique: true })
  missionId: string;

  @OneToOne(() => Mission, (m) => m.pod, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mission_id' })
  mission: Mission;

  @Column({ name: 'recipient_name', type: 'varchar', length: 150 })
  recipientName: string;

  @Column({ name: 'signature_url', type: 'text', nullable: true })
  signatureUrl: string | null;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'lat', type: 'double precision', nullable: true })
  lat: number | null;

  @Column({ name: 'lng', type: 'double precision', nullable: true })
  lng: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
