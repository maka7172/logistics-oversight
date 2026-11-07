import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { VehicleType } from '../../database/entities/vehicle-type.entity';
import { Driver } from '../../database/entities/driver.entity';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, VehicleType, Driver])],
  providers: [VehiclesService],
  controllers: [VehiclesController],
  exports: [VehiclesService],
})
export class VehiclesModule {}
