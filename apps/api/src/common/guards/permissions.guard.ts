import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * required permissions are treated as OR: user needs at least one.
 * Super admin / permission "*" bypasses all checks.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No user in request');

    if (user.isSuperAdmin || user.roles?.includes('super_admin')) return true;

    const userPerms: string[] = user.permissions || [];
    if (userPerms.includes('*')) return true;

    const ok = required.some((p) => userPerms.includes(p));
    if (!ok) {
      throw new ForbiddenException(`Missing permissions: need one of [${required.join(', ')}]`);
    }
    return true;
  }
}
