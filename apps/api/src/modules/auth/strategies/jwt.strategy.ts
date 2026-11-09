import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

function resolveJwtSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_ACCESS_SECRET must be set (min 32 chars) in production');
    }
    return 'dev_only_access_secret_change_me_32chars';
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    // permissions always from DB (revocation applies immediately)
    const permissions = this.authService.collectPermissionsPublic(user);
    return {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      roles: user.roles?.map((r) => r.code) || [],
      isSuperAdmin: user.isSuperAdmin,
      permissions,
      preferredLocale: user.preferredLocale,
    };
  }
}
