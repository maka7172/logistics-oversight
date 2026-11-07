import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
export class DriversController {
  constructor(private readonly service: DriversService) {}

  @Get()
  @Permissions('drivers:read')
  findAll(@Query('all') all?: string) {
    return this.service.findAll(all !== 'true');
  }

  @Get(':id')
  @Permissions('drivers:read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('drivers:write')
  @ApiOperation({ summary: 'Create driver; vehicle exclusive to one driver' })
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Permissions('drivers:write')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Post(':id/revoke-vehicle')
  @Permissions('drivers:write')
  @ApiOperation({ summary: 'Revoke assigned vehicle so it can be reassigned' })
  revoke(@Param('id') id: string) {
    return this.service.revokeVehicle(id);
  }

  @Delete(':id')
  @Permissions('drivers:write')
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
