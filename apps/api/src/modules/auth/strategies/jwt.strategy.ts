import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me_32chars_min',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      roles: user.roles?.map((r) => r.code) || [],
      isSuperAdmin: user.isSuperAdmin,
      permissions: payload.permissions || [],
      preferredLocale: user.preferredLocale,
    };
  }
}
