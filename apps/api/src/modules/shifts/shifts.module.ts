import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from '../../database/entities/shift.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { InventoryLoadRecord } from '../../database/entities/inventory-load-record.entity';
import { LoadLine } from '../../database/entities/load-line.entity';
import { Driver } from '../../database/entities/driver.entity';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, ShiftInventory, InventoryLoadRecord, LoadLine, Driver])],
  providers: [ShiftsService],
  controllers: [ShiftsController],
  exports: [ShiftsService],
})
export class ShiftsModule {}
