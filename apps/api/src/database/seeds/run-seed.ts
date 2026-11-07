/**
 * Seed script - run with: npm run seed
 */
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Device } from '../entities/device.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';

const PERMISSIONS = [
  { code: 'users:read', module: 'users', action: 'read' },
  { code: 'users:write', module: 'users', action: 'write' },
  { code: 'users:read_self', module: 'users', action: 'read_self' },
  { code: 'users:manage_roles', module: 'users', action: 'manage_roles' },
  { code: 'drivers:read', module: 'drivers', action: 'read' },
  { code: 'drivers:write', module: 'drivers', action: 'write' },
  { code: 'vehicles:read', module: 'vehicles', action: 'read' },
  { code: 'vehicles:write', module: 'vehicles', action: 'write' },
  { code: 'products:read', module: 'products', action: 'read' },
  { code: 'products:write', module: 'products', action: 'write' },
  { code: 'customers:read', module: 'customers', action: 'read' },
  { code: 'customers:write', module: 'customers', action: 'write' },
  { code: 'shifts:read', module: 'shifts', action: 'read' },
  { code: 'shifts:start', module: 'shifts', action: 'start' },
  { code: 'shifts:close', module: 'shifts', action: 'close' },
  { code: 'shifts:inventory', module: 'shifts', action: 'inventory' },
  { code: 'missions:read', module: 'missions', action: 'read' },
  { code: 'missions:write', module: 'missions', action: 'write' },
  { code: 'missions:assign', module: 'missions', action: 'assign' },
  { code: 'missions:close', module: 'missions', action: 'close' },
  { code: 'inventory:read', module: 'inventory', action: 'read' },
  { code: 'inventory:write', module: 'inventory', action: 'write' },
  { code: 'finance:read', module: 'finance', action: 'read' },
  { code: 'finance:write', module: 'finance', action: 'write' },
  { code: 'gis:read', module: 'gis', action: 'read' },
  { code: 'gis:write', module: 'gis', action: 'write' },
  { code: 'audit:read', module: 'audit', action: 'read' },
  { code: 'license:read', module: 'license', action: 'read' },
  { code: '*', module: 'system', action: 'all' },
];

const ROLES = [
  { code: 'super_admin', name: 'سوپر ادمین', nameEn: 'Super Admin', isSystem: true, perms: ['*'] },
  { code: 'admin', name: 'مدیر سیستم', nameEn: 'System Admin', isSystem: true, perms: ['users:read', 'users:write', 'users:manage_roles', 'drivers:read', 'drivers:write', 'vehicles:read', 'vehicles:write', 'products:read', 'products:write', 'customers:read', 'customers:write', 'shifts:read', 'missions:read', 'missions:write', 'missions:assign', 'inventory:read', 'finance:read', 'gis:read', 'audit:read', 'license:read'] },
  { code: 'dispatcher', name: 'دیسپچر', nameEn: 'Dispatcher', isSystem: true, perms: ['drivers:read', 'vehicles:read', 'customers:read', 'shifts:read', 'missions:read', 'missions:write', 'missions:assign', 'gis:read', 'gis:write'] },
  { code: 'supervisor', name: 'ناظر', nameEn: 'Supervisor', isSystem: true, perms: ['shifts:read', 'shifts:inventory', 'inventory:read', 'inventory:write', 'missions:read'] },
  { code: 'finance', name: 'مالی', nameEn: 'Finance', isSystem: true, perms: ['finance:read', 'finance:write', 'customers:read', 'shifts:read', 'missions:read'] },
  { code: 'driver', name: 'راننده', nameEn: 'Driver', isSystem: true, perms: ['users:read_self', 'shifts:read', 'shifts:start', 'shifts:close', 'missions:read', 'missions:close', 'inventory:read'] },
];

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'logistics',
    password: process.env.POSTGRES_PASSWORD || 'change_me_strong_password',
    database: process.env.POSTGRES_DB || 'logistics',
    entities: [User, Role, Permission, Device, IdempotencyKey],
    synchronize: true,
  });

  await ds.initialize();
  console.log('Connected to DB');

  const permRepo = ds.getRepository(Permission);
  const roleRepo = ds.getRepository(Role);
  const userRepo = ds.getRepository(User);

  // Permissions
  for (const p of PERMISSIONS) {
    let existing = await permRepo.findOne({ where: { code: p.code } });
    if (!existing) {
      existing = permRepo.create(p);
      await permRepo.save(existing);
      console.log(`Permission created: ${p.code}`);
    }
  }

  // Roles
  for (const r of ROLES) {
    let role = await roleRepo.findOne({ where: { code: r.code }, relations: ['permissions'] });
    if (!role) {
      role = roleRepo.create({
        code: r.code,
        name: r.name,
        nameEn: r.nameEn,
        isSystem: r.isSystem,
      });
      await roleRepo.save(role);
    }
    const perms: Permission[] = [];
    for (const code of r.perms) {
      const perm = await permRepo.findOne({ where: { code } });
      if (perm) perms.push(perm);
    }
    role.permissions = perms;
    await roleRepo.save(role);
    console.log(`Role ready: ${r.code}`);
  }

  // Super Admin
  const superPhone = '09120000000';
  let superUser = await userRepo.findOne({ where: { phone: superPhone }, relations: ['roles'] });
  if (!superUser) {
    const superRole = await roleRepo.findOne({ where: { code: 'super_admin' } });
    superUser = userRepo.create({
      phone: superPhone,
      fullName: 'Super Admin',
      isActive: true,
      isSuperAdmin: true,
      preferredLocale: 'fa',
      roles: superRole ? [superRole] : [],
    });
    await userRepo.save(superUser);
    console.log(`Super Admin created: ${superPhone}`);
  } else {
    console.log(`Super Admin already exists: ${superPhone}`);
  }

  // Sample driver
  const driverPhone = '09121111111';
  let driver = await userRepo.findOne({ where: { phone: driverPhone }, relations: ['roles'] });
  if (!driver) {
    const driverRole = await roleRepo.findOne({ where: { code: 'driver' } });
    driver = userRepo.create({
      phone: driverPhone,
      fullName: 'راننده نمونه',
      personnelCode: 'DRV-001',
      isActive: true,
      isSuperAdmin: false,
      preferredLocale: 'fa',
      roles: driverRole ? [driverRole] : [],
    });
    await userRepo.save(driver);
    console.log(`Sample driver created: ${driverPhone}`);
  } else {
    console.log(`Sample driver already exists: ${driverPhone}`);
  }

  await ds.destroy();
  console.log('Seed completed successfully');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Note: additional domain seed can be added here after entities are synced
