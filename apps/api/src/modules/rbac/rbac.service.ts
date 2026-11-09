import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
  ) {}

  listRoles() {
    return this.roleRepo.find({ relations: ['permissions'], order: { code: 'ASC' } });
  }

  listPermissions() {
    return this.permRepo.find({ order: { module: 'ASC', action: 'ASC' } });
  }

  async getRole(id: string) {
    const r = await this.roleRepo.findOne({ where: { id }, relations: ['permissions'] });
    if (!r) throw new NotFoundException('Role not found');
    return r;
  }

  private assertNoWildcard(perms: Permission[]) {
    if (perms.some((p) => p.code === '*')) {
      throw new ForbiddenException('Cannot assign wildcard (*) permission to custom roles');
    }
  }

  async createRole(data: {
    code: string;
    name: string;
    nameEn?: string;
    description?: string;
    permissionCodes?: string[];
  }) {
    if (!data.code || !data.name) throw new BadRequestException('code and name required');
    if (data.code === 'super_admin') throw new ForbiddenException('Cannot create super_admin role');
    const exists = await this.roleRepo.findOne({ where: { code: data.code } });
    if (exists) throw new BadRequestException('Role code already exists');

    let permissions: Permission[] = [];
    if (data.permissionCodes?.length) {
      permissions = await this.permRepo.find({ where: { code: In(data.permissionCodes) } });
      this.assertNoWildcard(permissions);
    }

    const role = this.roleRepo.create({
      code: data.code,
      name: data.name,
      nameEn: data.nameEn || null,
      description: data.description || null,
      isSystem: false,
      permissions,
    });
    return this.roleRepo.save(role);
  }

  async updateRole(
    id: string,
    data: {
      name?: string;
      nameEn?: string;
      description?: string;
      permissionCodes?: string[];
    },
  ) {
    const role = await this.getRole(id);
    if (role.isSystem || role.code === 'super_admin') {
      // allow renaming display only for system roles, not permission changes
      if (data.permissionCodes) {
        throw new ForbiddenException('Cannot change permissions of system roles');
      }
    }
    if (data.name !== undefined) role.name = data.name;
    if (data.nameEn !== undefined) role.nameEn = data.nameEn;
    if (data.description !== undefined) role.description = data.description;
    if (data.permissionCodes) {
      const permissions = await this.permRepo.find({ where: { code: In(data.permissionCodes) } });
      this.assertNoWildcard(permissions);
      role.permissions = permissions;
    }
    return this.roleRepo.save(role);
  }

  async deactivateSystemSafe(id: string) {
    const role = await this.getRole(id);
    if (role.isSystem || role.code === 'super_admin') {
      throw new ForbiddenException('Cannot delete system role');
    }
    await this.roleRepo.remove(role);
    return { success: true };
  }
}
