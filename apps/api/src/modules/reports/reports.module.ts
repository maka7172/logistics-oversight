import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from '../../database/entities/shift.entity';
import { Mission } from '../../database/entities/mission.entity';
import { Driver } from '../../database/entities/driver.entity';
import { Product } from '../../database/entities/product.entity';
import { Customer } from '../../database/entities/customer.entity';
import { LocationPing } from '../../database/entities/location-ping.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { Payment } from '../../database/entities/payment.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shift, Mission, Driver, Product, Customer, LocationPing, AuditLog, ShiftInventory, Payment,
    ]),
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
