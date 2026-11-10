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
  byShift(@Param('shiftId') shiftId: string, @CurrentUser() user: any) {
    return this.service.findByShift(shiftId, user);
  }

  @Get(':id')
  @Permissions('missions:read')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const m = await this.service.findOne(id);
    await this.service.assertCanAccessShift(m.shiftId, user);
    return m;
  }

  @Post()
  @Permissions('missions:write', 'missions:assign', 'shifts:inventory')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post(':id/arrive')
  @Permissions('missions:close', 'missions:write')
  @ApiOperation({ summary: 'Mark arrival (idempotent)' })
  arrive(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { lat?: number; lng?: number; distanceM?: number },
  ) {
    return this.service.markArrival(id, user, body?.lat, body?.lng, body?.distanceM);
  }

  @Post(':id/complete')
  @Permissions('missions:close')
  @ApiHeader({ name: 'X-Client-Op-Id', required: false })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Headers('x-client-op-id') clientOpId: string | undefined,
    @Headers('idempotency-key') idemKey: string | undefined,
    @Body() body: any,
  ) {
    return this.service.completeMission(id, user, clientOpId || idemKey, body || {});
  }
}
