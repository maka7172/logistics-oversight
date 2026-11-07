import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
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
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @Permissions('shifts:read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
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

  @Post()
  @Permissions('shifts:start', 'shifts:read', 'shifts:inventory', 'inventory:write')
  @ApiOperation({ summary: 'Create shift for a driver' })
  create(@Body() body: { driverId: string; vehicleId?: string }) {
    return this.service.create(body.driverId, body.vehicleId);
  }

  @Post(':id/load')
  @Permissions('shifts:inventory', 'inventory:write')
  @ApiOperation({ summary: 'Supervisor: register opening inventory + cash (G1)' })
  createLoad(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { openingCash: number; lines: { productId: string; qty: number }[] },
  ) {
    return this.service.createLoadRecord(id, user.id, body.openingCash || 0, body.lines || []);
  }

  @Post('load/:recordId/approve')
  @Permissions('shifts:inventory', 'inventory:write')
  @ApiOperation({ summary: 'Approve load record (approved_by) and set shift READY' })
  approveLoad(@Param('recordId') recordId: string, @CurrentUser() user: any) {
    return this.service.approveLoad(recordId, user.id);
  }

  @Post(':id/start')
  @Permissions('shifts:start')
  @ApiOperation({ summary: 'Driver starts shift' })
  start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.startShift(id, user.id);
  }

  @Post(':id/close')
  @Permissions('shifts:close')
  @ApiOperation({ summary: 'Close shift with reported cash' })
  close(
    @Param('id') id: string,
    @Body() body: { closingCashReported: number; discrepancyNote?: string },
  ) {
    return this.service.closeShift(id, body.closingCashReported, body.discrepancyNote);
  }
}
