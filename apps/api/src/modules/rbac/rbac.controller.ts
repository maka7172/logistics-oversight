import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('RBAC')
@ApiBearerAuth()
@Controller('rbac')
export class RbacController {
  constructor(private readonly service: RbacService) {}

  @Get('roles')
  @Permissions('users:manage_roles')
  @ApiOperation({ summary: 'List roles with permissions (super admin)' })
  listRoles() {
    return this.service.listRoles();
  }

  @Get('permissions')
  @Permissions('users:manage_roles')
  @ApiOperation({ summary: 'List all permissions' })
  listPermissions() {
    return this.service.listPermissions();
  }

  @Get('roles/:id')
  @Permissions('users:manage_roles')
  getRole(@Param('id') id: string) {
    return this.service.getRole(id);
  }

  @Post('roles')
  @Permissions('users:manage_roles')
  @ApiOperation({ summary: 'Create custom role with selected permissions' })
  createRole(@Body() body: any) {
    return this.service.createRole(body);
  }

  @Patch('roles/:id')
  @Permissions('users:manage_roles')
  @ApiOperation({ summary: 'Update role name/permissions' })
  updateRole(@Param('id') id: string, @Body() body: any) {
    return this.service.updateRole(id, body);
  }

  @Delete('roles/:id')
  @Permissions('users:manage_roles')
  @ApiOperation({ summary: 'Delete non-system role' })
  removeRole(@Param('id') id: string) {
    return this.service.deactivateSystemSafe(id);
  }
}
