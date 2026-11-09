import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from '../../database/entities/mission.entity';
import { MissionItem } from '../../database/entities/mission-item.entity';
import { Payment } from '../../database/entities/payment.entity';
import { PodRecord } from '../../database/entities/pod-record.entity';
import { ReturnRecord } from '../../database/entities/return-record.entity';
import { ShiftInventory } from '../../database/entities/shift-inventory.entity';
import { CustomerLedger } from '../../database/entities/customer-ledger.entity';
import { Customer } from '../../database/entities/customer.entity';
import { IdempotencyKey } from '../../database/entities/idempotency-key.entity';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { Shift } from '../../database/entities/shift.entity';
import { Driver } from '../../database/entities/driver.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Mission, MissionItem, Payment, PodRecord, ReturnRecord,
      ShiftInventory, CustomerLedger, Customer, IdempotencyKey,
      Shift, Driver,
    ]),
  ],
  providers: [MissionsService],
  controllers: [MissionsController],
  exports: [MissionsService],
})
export class MissionsModule {}




