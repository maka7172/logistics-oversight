import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['roles', 'roles.permissions'] });
  }

  findByPhone(phone: string) {
    return this.repo.findOne({ where: { phone }, relations: ['roles', 'roles.permissions'] });
  }

  async list(activeOnly = true) {
    const where: any = activeOnly ? { isActive: true } : {};
    return this.repo.find({
      where,
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }

  async listRoles() {
    return this.roleRepo.find({ order: { code: 'ASC' } });
  }

  async create(data: {
    phone: string;
    fullName: string;
    email?: string;
    personnelCode?: string;
    preferredLocale?: string;
    roleCodes?: string[];
    isSuperAdmin?: boolean;
  }) {
    const exists = await this.repo.findOne({ where: { phone: data.phone } });
    if (exists) throw new BadRequestException('Phone already registered');

    let roles: Role[] = [];
    if (data.roleCodes?.length) {
      roles = await this.roleRepo.find({ where: { code: In(data.roleCodes) } });
    }

    const user = this.repo.create({
      phone: data.phone,
      fullName: data.fullName,
      email: data.email || null,
      personnelCode: data.personnelCode || null,
      preferredLocale: data.preferredLocale || 'fa',
      isActive: true,
      isSuperAdmin: data.isSuperAdmin || false,
      roles,
    });
    return this.repo.save(user);
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
    },
  ) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.email !== undefined) user.email = data.email;
    if (data.personnelCode !== undefined) user.personnelCode = data.personnelCode;
    if (data.preferredLocale !== undefined) user.preferredLocale = data.preferredLocale;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    if ((data as any).isSuperAdmin !== undefined) user.isSuperAdmin = (data as any).isSuperAdmin;

    if (data.roleCodes) {
      user.roles = await this.roleRepo.find({ where: { code: In(data.roleCodes) } });
    }

    return this.repo.save(user);
  }
}
