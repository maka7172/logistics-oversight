import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  @Permissions('customers:read')
  findAll(@Query('all') all?: string) {
    return this.service.findAll(all !== 'true');
  }

  @Get(':id')
  @Permissions('customers:read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('customers:write')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  @Permissions('customers:write')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}
