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
  @ApiOperation({ summary: 'List all roles' })
  roles() {
    return this.usersService.listRoles();
  }

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'List users' })
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
  @ApiOperation({ summary: 'Create user and assign roles (isSuperAdmin only by super admin)' })
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @Permissions('users:write', 'users:manage_roles')
  @ApiOperation({ summary: 'Update user and roles' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }
}
