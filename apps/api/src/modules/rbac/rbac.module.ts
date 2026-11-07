import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../database/entities/role.entity';
import { Permission } from '../../database/entities/permission.entity';
import { User } from '../../database/entities/user.entity';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, User])],
  providers: [RbacService],
  controllers: [RbacController],
  exports: [TypeOrmModule, RbacService],
})
export class RbacModule {}
