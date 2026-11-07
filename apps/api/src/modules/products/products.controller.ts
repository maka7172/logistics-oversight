import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @Permissions('products:read')
  findAll(@Query('all') all?: string) {
    return this.service.findAll(all !== 'true');
  }

  @Get('next-code')
  @Permissions('products:write')
  nextCode() {
    return this.service.nextCode().then((code) => ({ code }));
  }

  @Get(':id')
  @Permissions('products:read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('products:write')
  @ApiOperation({ summary: 'Create product (code auto-generated)' })
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Permissions('products:write')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Permissions('products:write')
  @ApiOperation({ summary: 'Soft-delete if no inventory' })
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Post(':id/transfer')
  @Permissions('products:write')
  @ApiOperation({ summary: 'Transfer inventory to another product then deactivate' })
  transfer(@Param('id') id: string, @Body() body: { toProductId: string }) {
    return this.service.transfer(id, body.toProductId);
  }
}
