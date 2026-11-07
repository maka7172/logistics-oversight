import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { HealthModule } from './modules/health/health.module';
import { LicenseModule } from './modules/license/license.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ProductsModule } from './modules/products/products.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { MissionsModule } from './modules/missions/missions.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PodModule } from './modules/pod/pod.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { GisModule } from './modules/gis/gis.module';
import { SyncModule } from './modules/sync/sync.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AuditModule } from './modules/audit/audit.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { loadAppConfig } from './config/load-config';

// Explicit entity imports to avoid metadata issues
import { User } from './database/entities/user.entity';
import { Role } from './database/entities/role.entity';
import { Permission } from './database/entities/permission.entity';
import { Device } from './database/entities/device.entity';
import { IdempotencyKey } from './database/entities/idempotency-key.entity';
import { Product } from './database/entities/product.entity';
import { ProductUnit } from './database/entities/product-unit.entity';
import { ProductCategory } from './database/entities/product-category.entity';
import { Warehouse } from './database/entities/warehouse.entity';
import { AuditLog } from './database/entities/audit-log.entity';
import { LocationPing } from './database/entities/location-ping.entity';
import { VehicleType } from './database/entities/vehicle-type.entity';
import { Vehicle } from './database/entities/vehicle.entity';
import { Driver } from './database/entities/driver.entity';
import { Customer } from './database/entities/customer.entity';
import { Shift } from './database/entities/shift.entity';
import { ShiftInventory } from './database/entities/shift-inventory.entity';
import { InventoryLoadRecord } from './database/entities/inventory-load-record.entity';
import { LoadLine } from './database/entities/load-line.entity';
import { Mission } from './database/entities/mission.entity';
import { MissionItem } from './database/entities/mission-item.entity';
import { Payment } from './database/entities/payment.entity';
import { PodRecord } from './database/entities/pod-record.entity';
import { ReturnRecord } from './database/entities/return-record.entity';
import { CustomerLedger } from './database/entities/customer-ledger.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadAppConfig],
      envFilePath: [
        join(process.cwd(), '../../.env'),
        join(process.cwd(), '../../config/secrets.env'),
        join(process.cwd(), '.env'),
        '.env',
      ],
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
        redact: ['req.headers.authorization', 'req.body.password', 'req.body.otp'],
      },
    }),

    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 120,
      },
    ]),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'logistics',
        password: process.env.POSTGRES_PASSWORD || 'change_me_strong_password',
        database: process.env.POSTGRES_DB || 'logistics',
        entities: [
          User, Role, Permission, Device, IdempotencyKey,
          Product, VehicleType, Vehicle, Driver, Customer,
          Shift, ShiftInventory, InventoryLoadRecord, LoadLine,
          Mission, MissionItem, Payment, PodRecord, ReturnRecord, CustomerLedger,
        ],
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined,
        logging: false,
        ssl: false,
      }),
    }),

    HealthModule,
    LicenseModule,
    AuthModule,
    UsersModule,
    RbacModule,
    DriversModule,
    VehiclesModule,
    ProductsModule,
    CatalogModule,
    ReportsModule,
    CustomersModule,
    ShiftsModule,
    MissionsModule,
    InventoryModule,
    PaymentsModule,
    PodModule,
    ReturnsModule,
    LedgerModule,
    GisModule,
    SyncModule,
    RealtimeModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
