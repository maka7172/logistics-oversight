import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  // Units
  @Get('units')
  @Permissions('products:read')
  listUnits(@Query('all') all?: string) { return this.service.listUnits(all !== 'true'); }

  @Post('units')
  @Permissions('products:write')
  @ApiOperation({ summary: 'Define product unit (kg, box, ...)' })
  createUnit(@Body() body: any) { return this.service.createUnit(body); }

  @Patch('units/:id')
  @Permissions('products:write')
  updateUnit(@Param('id') id: string, @Body() body: any) { return this.service.updateUnit(id, body); }

  // Warehouses
  @Get('warehouses')
  @Permissions('products:read')
  listWh(@Query('all') all?: string) { return this.service.listWarehouses(all !== 'true'); }

  @Post('warehouses')
  @Permissions('products:write')
  createWh(@Body() body: any) { return this.service.createWarehouse(body); }

  @Patch('warehouses/:id')
  @Permissions('products:write')
  updateWh(@Param('id') id: string, @Body() body: any) { return this.service.updateWarehouse(id, body); }

  // Categories
  @Get('categories')
  @Permissions('products:read')
  listCat(@Query('all') all?: string) { return this.service.listCategories(all !== 'true'); }

  @Post('categories')
  @Permissions('products:write')
  createCat(@Body() body: any) { return this.service.createCategory(body); }

  @Patch('categories/:id')
  @Permissions('products:write')
  updateCat(@Param('id') id: string, @Body() body: any) { return this.service.updateCategory(id, body); }
}
