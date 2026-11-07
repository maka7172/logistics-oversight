import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductUnit } from '../../database/entities/product-unit.entity';
import { Warehouse } from '../../database/entities/warehouse.entity';
import { ProductCategory } from '../../database/entities/product-category.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductUnit, Warehouse, ProductCategory])],
  providers: [CatalogService],
  controllers: [CatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}
