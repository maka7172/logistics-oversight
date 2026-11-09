import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private audit: AuditService,
  ) {}

  listRoles() {
    return this.roleRepo.find({ relations: ['permissions'], order: { code: 'ASC' } });
  }

  list(activeOnly = true) {
    const where: any = activeOnly ? { isActive: true } : {};
    return this.repo.find({ where, relations: ['roles'], order: { createdAt: 'DESC' }, take: 500 });
  }

  async findById(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(
    data: {
      phone: string;
      fullName: string;
      email?: string;
      personnelCode?: string;
      preferredLocale?: string;
      roleCodes?: string[];
      isSuperAdmin?: boolean;
    },
    actor?: { id: string; isSuperAdmin?: boolean },
  ) {
    const exists = await this.repo.findOne({ where: { phone: data.phone } });
    if (exists) throw new BadRequestException('Phone already registered');

    if (data.isSuperAdmin && !actor?.isSuperAdmin) {
      throw new ForbiddenException('Only super admin can grant isSuperAdmin');
    }

    let roles: Role[] = [];
    if (data.roleCodes?.length) {
      roles = await this.roleRepo.find({ where: { code: In(data.roleCodes) }, relations: ['permissions'] });
      this.assertNoStarEscalation(roles, actor);
    }

    const user = this.repo.create({
      phone: data.phone,
      fullName: data.fullName,
      email: data.email || null,
      personnelCode: data.personnelCode || null,
      preferredLocale: data.preferredLocale || 'fa',
      isActive: true,
      isSuperAdmin: actor?.isSuperAdmin ? !!data.isSuperAdmin : false,
      roles,
    });
    const saved = await this.repo.save(user);
    await this.audit.log({
      userId: actor?.id,
      action: 'user.create',
      module: 'users',
      entityId: saved.id,
      summary: `Created user ${saved.phone}`,
    });
    return saved;
  }

  async update(
    id: string,
    data: {
      fullName?: string;
      email?: string;
      personnelCode?: string;
      preferredLocale?: string;
      isActive?: boolean;
      roleCodes?: string[];
      isSuperAdmin?: boolean;
    },
    actor?: { id: string; isSuperAdmin?: boolean },
  ) {
    const user = await this.findById(id);

    if (data.isSuperAdmin !== undefined) {
      if (!actor?.isSuperAdmin) {
        throw new ForbiddenException('Only super admin can change isSuperAdmin');
      }
      user.isSuperAdmin = !!data.isSuperAdmin;
    }

    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.email !== undefined) user.email = data.email;
    if (data.personnelCode !== undefined) user.personnelCode = data.personnelCode;
    if (data.preferredLocale !== undefined) user.preferredLocale = data.preferredLocale;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    if (data.roleCodes) {
      const roles = await this.roleRepo.find({
        where: { code: In(data.roleCodes) },
        relations: ['permissions'],
      });
      this.assertNoStarEscalation(roles, actor);
      user.roles = roles;
    }

    const saved = await this.repo.save(user);
    await this.audit.log({
      userId: actor?.id,
      action: 'user.update',
      module: 'users',
      entityId: id,
      summary: `Updated user ${user.phone}`,
      payload: { fields: Object.keys(data) },
    });
    return saved;
  }

  private assertNoStarEscalation(roles: Role[], actor?: { isSuperAdmin?: boolean }) {
    if (actor?.isSuperAdmin) return;
    for (const r of roles) {
      if (r.code === 'super_admin') {
        throw new ForbiddenException('Cannot assign super_admin role');
      }
      for (const p of r.permissions || []) {
        if (p.code === '*') {
          throw new ForbiddenException('Cannot assign role with wildcard permission');
        }
      }
    }
  }
}
