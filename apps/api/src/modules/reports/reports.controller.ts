import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  @Permissions('finance:read', 'shifts:read', 'missions:read')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('shifts')
  @Permissions('shifts:read', 'finance:read')
  shifts() {
    return this.service.shiftsReport();
  }

  @Get('missions')
  @Permissions('missions:read', 'finance:read')
  missions() {
    return this.service.missionsReport();
  }

  @Get('inventory/:shiftId')
  @Permissions('inventory:read', 'shifts:read')
  inventory(@Param('shiftId') shiftId: string) {
    return this.service.inventoryByShift(shiftId);
  }

  @Get('live-drivers')
  @Permissions('gis:read', 'shifts:read', 'shifts:inventory', 'missions:read')
  @ApiOperation({ summary: 'Live driver positions (last ping)' })
  liveDrivers() {
    return this.service.liveDrivers();
  }

  @Post('location-ping')
  @Permissions('gis:write', 'shifts:start', 'missions:close', 'shifts:read', 'shifts:inventory')
  postPing(@Body() body: any) {
    return this.service.postPing(body);
  }

  @Get('audit')
  @Permissions('audit:read')
  audit(@Query('take') take?: string) {
    return this.service.audit(take ? parseInt(take, 10) : 200);
  }
}
