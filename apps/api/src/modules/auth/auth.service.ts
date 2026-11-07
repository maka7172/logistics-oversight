import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Device } from '../../database/entities/device.entity';
import { OtpService } from './otp.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const user = await this.userRepo.findOne({
      where: { phone: dto.phone, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      // Do not reveal whether user exists (security)
      return { success: true, message: 'If the number is registered, OTP will be sent' };
    }
    return this.otpService.sendOtp(dto.phone);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const valid = await this.otpService.verifyOtp(dto.phone, dto.code);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.userRepo.findOne({
      where: { phone: dto.phone, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Upsert device
    if (dto.deviceId) {
      let device = await this.deviceRepo.findOne({ where: { deviceId: dto.deviceId } });
      if (device) {
        device.lastSeenAt = new Date();
        device.model = dto.deviceModel || device.model;
        device.osVersion = dto.osVersion || device.osVersion;
        device.appVersion = dto.appVersion || device.appVersion;
        await this.deviceRepo.save(device);
      } else {
        device = this.deviceRepo.create({
          userId: user.id,
          deviceId: dto.deviceId,
          model: dto.deviceModel,
          osVersion: dto.osVersion,
          appVersion: dto.appVersion,
          lastSeenAt: new Date(),
        });
        await this.deviceRepo.save(device);
      }
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const permissions = this.collectPermissions(user);
    const payload = {
      sub: user.id,
      phone: user.phone,
      roles: user.roles?.map((r) => r.code) || [],
      isSuperAdmin: user.isSuperAdmin,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);
    // Refresh token can be added later with a separate secret and longer expiry

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        preferredLocale: user.preferredLocale,
        roles: user.roles?.map((r) => ({ code: r.code, name: r.name })),
        isSuperAdmin: user.isSuperAdmin,
        permissions,
      },
    };
  }

  private collectPermissions(user: User): string[] {
    if (user.isSuperAdmin) return ['*'];
    const set = new Set<string>();
    for (const role of user.roles || []) {
      for (const p of role.permissions || []) {
        set.add(p.code);
      }
    }
    return Array.from(set);
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });
  }
}
