import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpService } from './otp.service';
import { User } from '../../database/entities/user.entity';
import { Device } from '../../database/entities/device.entity';
import { Role } from '../../database/entities/role.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Device, Role]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me_32chars_min',
        signOptions: {
          expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
