import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Shifts')
@ApiBearerAuth()
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly service: ShiftsService) {}

  @Get()
  @Permissions('shifts:read')
  findAll(@Query('status') status: string | undefined, @CurrentUser() user: any) {
    return this.service.findAll(status, user);
  }

  /** static path first — avoid capture by :id */
  @Post('load/:recordId/approve')
  @Permissions('shifts:inventory', 'inventory:write')
  @ApiOperation({ summary: 'Approve inventory load → shift becomes ready' })
  approveLoad(@Param('recordId') recordId: string, @CurrentUser() user: any) {
    return this.service.approveLoad(recordId, user.id);
  }

  @Get(':id/loads')
  @Permissions('shifts:inventory', 'inventory:read')
  loads(@Param('id') id: string) {
    return this.service.listLoadRecords(id);
  }

  @Get(':id/inventory')
  @Permissions('inventory:read', 'shifts:read')
  inventory(@Param('id') id: string) {
    return this.service.getInventory(id);
  }

  @Get(':id')
  @Permissions('shifts:read')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.assertCanAccess(id, user);
  }

  @Post()
  @Permissions('shifts:start', 'shifts:read', 'shifts:inventory', 'inventory:write')
  create(@CurrentUser() user: any, @Body() body: { driverId: string; vehicleId?: string }) {
    return this.service.create(body.driverId, body.vehicleId, user.id);
  }

  @Post(':id/load')
  @Permissions('shifts:inventory', 'inventory:write')
  createLoad(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { openingCash: number; lines: { productId: string; qty: number }[] },
  ) {
    return this.service.createLoadRecord(id, user.id, body.openingCash || 0, body.lines || []);
  }

  @Post(':id/start')
  @Permissions('shifts:start')
  start(@Param('id') id: string, @CurrentUser() user: any) {
    const staff = !!(user.isSuperAdmin || user.roles?.includes('supervisor') || user.roles?.includes('admin'));
    return this.service.startShift(id, user.id, staff);
  }

  @Post(':id/close')
  @Permissions('shifts:close')
  close(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { closingCashReported: number; discrepancyNote?: string },
  ) {
    return this.service.closeShift(id, user, body.closingCashReported ?? 0, body.discrepancyNote);
  }
}
