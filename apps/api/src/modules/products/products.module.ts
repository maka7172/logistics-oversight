import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../database/entities/product.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { ProductUnit } from '../../database/entities/product-unit.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ShiftInventory, ProductUnit])],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
