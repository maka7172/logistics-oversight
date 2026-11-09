import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Permissions('users:read_self', 'users:read')
  me(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Get('roles')
  @Permissions('users:read', 'users:manage_roles')
  roles() {
    return this.usersService.listRoles();
  }

  @Get()
  @Permissions('users:read')
  list(@Query('all') all?: string) {
    return this.usersService.list(all !== 'true');
  }

  @Get(':id')
  @Permissions('users:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Permissions('users:write')
  create(@CurrentUser() actor: any, @Body() body: any) {
    const { isSuperAdmin, ...rest } = body || {};
    return this.usersService.create(
      { ...rest, isSuperAdmin: !!isSuperAdmin },
      { id: actor.id, isSuperAdmin: !!actor.isSuperAdmin },
    );
  }

  @Patch(':id')
  @Permissions('users:write', 'users:manage_roles')
  update(@Param('id') id: string, @CurrentUser() actor: any, @Body() body: any) {
    return this.usersService.update(id, body || {}, {
      id: actor.id,
      isSuperAdmin: !!actor.isSuperAdmin,
    });
  }
}
