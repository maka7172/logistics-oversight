import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Device } from '../../database/entities/device.entity';
import { OtpService } from './otp.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
    private otpService: OtpService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  async requestOtp(dto: { phone: string }) {
    // Always same message shape to reduce user enumeration
    try {
      const user = await this.userRepo.findOne({ where: { phone: dto.phone, isActive: true } });
      const result = await this.otpService.sendOtp(dto.phone);
      if (!user && process.env.NODE_ENV === 'production') {
        // still "success" without sending difference — but OTP was generated only if provider accepted
        return { success: true, message: 'If the number is registered, OTP will be sent' };
      }
      if (!user) {
        return {
          success: true,
          message: result.message,
          ...(result.mockCode ? { mockCode: result.mockCode } : {}),
        };
      }
      return result;
    } catch (e) {
      throw e;
    }
  }

  async verifyOtp(dto: {
    phone: string;
    code: string;
    deviceId?: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
  }) {
    const valid = await this.otpService.verifyOtp(dto.phone, dto.code);
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');

    const user = await this.userRepo.findOne({
      where: { phone: dto.phone, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) throw new UnauthorizedException('User not found or inactive');

    if (dto.deviceId) {
      let device = await this.deviceRepo.findOne({ where: { deviceId: dto.deviceId } });
      if (device) {
        if (device.userId && device.userId !== user.id) {
          throw new UnauthorizedException('Device is bound to another user');
        }
        device.userId = user.id;
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
    const tokens = this.issueTokens(user, permissions);

    await this.audit.log({
      userId: user.id,
      userPhone: user.phone,
      userName: user.fullName,
      action: 'login',
      module: 'auth',
      summary: 'OTP login success',
    });

    return {
      ...tokens,
      tokenType: 'Bearer',
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

  async refresh(refreshToken: string) {
    try {
      const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
      if (!secret) throw new UnauthorizedException('Refresh not configured');
      const payload = this.jwtService.verify(refreshToken, { secret });
      if (payload?.type !== 'refresh') throw new UnauthorizedException('Invalid refresh token');
      const user = await this.validateUserById(payload.sub);
      if (!user) throw new UnauthorizedException();
      const permissions = this.collectPermissions(user);
      return this.issueTokens(user, permissions);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private issueTokens(user: User, permissions: string[]) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      roles: user.roles?.map((r) => r.code) || [],
      isSuperAdmin: user.isSuperAdmin,
      permissions,
    };
    const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev_only_access_secret_change_me_32chars';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || accessSecret;
    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      },
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    };
  }

  private collectPermissions(user: User): string[] {
    if (user.isSuperAdmin) return ['*'];
    const set = new Set<string>();
    for (const role of user.roles || []) {
      for (const p of role.permissions || []) set.add(p.code);
    }
    return Array.from(set);
  }

  /** used by JwtStrategy */
  collectPermissionsPublic(user: User): string[] {
    return this.collectPermissions(user);
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId, isActive: true },
      relations: ['roles', 'roles.permissions'],
    });
  }
}
