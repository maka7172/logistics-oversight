import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private repo: Repository<AuditLog>) {}

  async log(entry: {
    userId?: string | null;
    userPhone?: string | null;
    userName?: string | null;
    action: string;
    module: string;
    entityId?: string | null;
    summary?: string | null;
    payload?: Record<string, any> | null;
    ip?: string | null;
  }) {
    const row = this.repo.create({
      userId: entry.userId || null,
      userPhone: entry.userPhone || null,
      userName: entry.userName || null,
      action: entry.action,
      module: entry.module,
      entityId: entry.entityId || null,
      summary: entry.summary || null,
      payload: entry.payload || null,
      ip: entry.ip || null,
    });
    return this.repo.save(row);
  }

  async list(params?: { module?: string; userId?: string; take?: number }) {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.created_at', 'DESC');
    if (params?.module) qb.andWhere('a.module = :module', { module: params.module });
    if (params?.userId) qb.andWhere('a.user_id = :userId', { userId: params.userId });
    qb.take(params?.take || 200);
    return qb.getMany();
  }
}
