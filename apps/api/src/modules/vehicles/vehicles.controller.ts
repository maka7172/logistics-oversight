import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get('types')
  @Permissions('vehicles:read')
  listTypes(@Query('all') all?: string) {
    return this.service.listTypes(all !== 'true');
  }

  @Post('types')
  @Permissions('vehicles:write')
  createType(@Body() body: any) {
    return this.service.createType(body);
  }

  @Patch('types/:id')
  @Permissions('vehicles:write')
  updateType(@Param('id') id: string, @Body() body: any) {
    return this.service.updateType(id, body);
  }

  @Get('available')
  @Permissions('vehicles:read', 'drivers:read')
  @ApiOperation({ summary: 'List vehicles not assigned to any active driver' })
  available() {
    return this.service.listAvailable();
  }

  @Get()
  @Permissions('vehicles:read')
  list(@Query('all') all?: string) {
    return this.service.listVehicles(all !== 'true');
  }

  @Get(':id')
  @Permissions('vehicles:read')
  get(@Param('id') id: string) {
    return this.service.getVehicle(id);
  }

  @Post()
  @Permissions('vehicles:write')
  create(@Body() body: any) {
    return this.service.createVehicle(body);
  }

  @Patch(':id')
  @Permissions('vehicles:write')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.updateVehicle(id, body);
  }

  @Delete(':id')
  @Permissions('vehicles:write')
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
