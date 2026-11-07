export interface JwtPayload {
  sub: string;
  phone: string;
  roles: string[];
  isSuperAdmin: boolean;
  permissions: string[];
}
