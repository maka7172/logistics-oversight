# Logistics Oversight v2 – Progress Report

**Date**: 2026-11-01  
**Status**: Foundation complete – Backend skeleton + Config + Auth + RBAC + Docker ready for first run

## Completed

### Infrastructure & Config
- [x] Monorepo structure (apps / packages / infra / config / docs / scripts)
- [x] Docker Compose (Postgres+PostGIS, Redis, MinIO, Centrifugo, OSRM placeholder, API profile)
- [x] Central config system:
  - `config/app.config.yaml` (all business rules, feature flags, limits)
  - `config/secrets.example.env` (API keys, JWT, SMS.ir, MinIO…)
  - `config/license.json.example` (modules, limits, expiry)
  - `.env.example`
- [x] `.gitignore` protecting secrets
- [x] README with quick start

### Backend (NestJS)
- [x] Project bootstrap (package.json, tsconfig, nest-cli, Dockerfile)
- [x] main.ts with Helmet, Compression, CORS from config, ValidationPipe, Versioning, Swagger
- [x] AppModule with global Config, Logger (Pino), Throttler, TypeORM, all feature modules
- [x] Config loader (YAML + env)
- [x] LicenseService (loads license.json, falls back to DEV mode)
- [x] Health endpoints (`/api/v1/health`, `/api/v1/health/ready`)
- [x] Common: `@Public()`, `@Permissions()`, `@CurrentUser()`, JwtAuthGuard, PermissionsGuard
- [x] Entities: User, Role, Permission, Device, IdempotencyKey
- [x] Auth module:
  - Request OTP (rate limited)
  - Verify OTP → JWT
  - Mock OTP provider (logs code, returns mockCode for testing)
  - SMS.ir ready (just add credentials to secrets.env and set `otp.provider: smsir`)
  - Device registration on login
- [x] Users module (basic `/users/me`)
- [x] Seed script: Super Admin (09120000000), sample Driver (09121111111), all roles + granular permissions
- [x] Module stubs for: Drivers, Vehicles, Products, Customers, Shifts, Missions, Inventory, Payments, POD, Returns, Ledger, GIS, Navigation, Sync, Realtime, Audit, RBAC

### Shared
- [x] Enums: MissionStatus, ShiftStatus, PaymentMethod, ReturnKind, UserRoleCode
- [x] JwtPayload type

## Next Immediate Steps (in order)
1. Remaining core entities (Driver, Vehicle, Product, Customer, Shift, ShiftInventory, Mission, MissionItem, Payment, PodRecord, Return, CustomerLedger, LocationPing, Geofence, Route, RouteStop, AuditLog, ChatMessage, Incident…)
2. Full RBAC management endpoints (Super Admin can create roles & assign permissions)
3. Shifts + Inventory transactional logic (G3)
4. Missions + close mission transaction (G3 + G5 + Idempotency G4)
5. Flutter Driver app skeleton with i18n (fa/en) and clean UI
6. GIS + Realtime location push
7. Web panel (Next.js) skeleton

## How to test current foundation

```bash
cd logistics-oversight
cp .env.example .env
cp config/secrets.example.env config/secrets.env
cp config/license.json.example config/license.json

# Start infra only
docker compose up -d postgres redis minio centrifugo

# In another terminal
cd apps/api
npm install
# Wait for postgres healthy, then:
npm run seed
npm run start:dev
```

Then open http://localhost:3000/docs

- POST `/api/v1/auth/otp/request` with `{ "phone": "09120000000" }` → get mockCode
- POST `/api/v1/auth/otp/verify` with phone + code → receive JWT
- Use JWT on `/api/v1/users/me` and `/api/v1/license`

## Security already in place
- Helmet
- Strict ValidationPipe (whitelist + forbid non-whitelisted)
- Rate limiting (global + stricter on OTP)
- JWT short-lived
- Public routes explicitly marked
- PermissionsGuard with Super Admin bypass
- Secrets outside code
- License check foundation
