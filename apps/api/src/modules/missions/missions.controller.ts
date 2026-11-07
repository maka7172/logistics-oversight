import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { MissionsService } from './missions.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Missions')
@ApiBearerAuth()
@Controller('missions')
export class MissionsController {
  constructor(private readonly service: MissionsService) {}

  @Get('by-shift/:shiftId')
  @Permissions('missions:read')
  byShift(@Param('shiftId') shiftId: string) {
    return this.service.findByShift(shiftId);
  }

  @Get(':id')
  @Permissions('missions:read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('missions:write', 'missions:assign', 'shifts:inventory')
  @ApiOperation({ summary: 'Create mission with optional items' })
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post(':id/arrive')
  @Permissions('missions:close', 'missions:write')
  @ApiOperation({ summary: 'Register arrival (GPS optional)' })
  arrive(
    @Param('id') id: string,
    @Body() body: { lat?: number; lng?: number; distanceM?: number },
  ) {
    return this.service.markArrival(id, body.lat, body.lng, body.distanceM);
  }

  @Post(':id/complete')
  @Permissions('missions:close')
  @ApiHeader({ name: 'X-Client-Op-Id', required: false })
  @ApiOperation({ summary: 'Complete mission — transactional inventory (G3) + returns/ledger (G5) + idempotency (G4)' })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Headers('x-client-op-id') clientOpId: string | undefined,
    @Body() body: any,
  ) {
    return this.service.completeMission(id, user.id, clientOpId, body);
  }
}
