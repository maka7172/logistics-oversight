# Logistics Oversight v2

سیستم کامل نظارت و اجرای عملیات لجستیک میدانی (Stack B از روز اول)

**Tech Stack**
- **Mobile**: Flutter (Driver + Supervisor apps) – RTL + i18n (fa/en)
- **Web**: Next.js 14+ (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: NestJS (modular) + TypeORM
- **Database**: PostgreSQL 16 + PostGIS
- **Realtime**: Centrifugo + Redis
- **Storage**: MinIO
- **Routing**: OSRM + VROOM
- **Queue**: BullMQ
- **Infra**: Docker Compose (dev) → k3s (prod)

## Quick Start (Development)

```bash
# 1. Enter project
cd logistics-oversight

# 2. Copy configs
cp .env.example .env
cp config/secrets.example.env config/secrets.env
cp config/license.json.example config/license.json

# 3. Start infrastructure
docker compose up -d

# 4. Install & run API
cd apps/api
npm install
npm run migration:run
npm run seed
npm run start:dev

# 5. Flutter Driver
cd apps/driver
flutter pub get
flutter run
```

## Project Structure

```
logistics-oversight/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js admin panel
│   ├── driver/       # Flutter driver app
│   └── supervisor/   # Flutter supervisor tablet app
├── packages/
│   └── shared/       # Shared types, DTOs, enums, constants
├── infra/
│   ├── docker/       # Extra Docker files
│   ├── k3s/          # Kubernetes manifests (later)
│   └── scripts/      # Backup, migrate, seed helpers
├── config/           # All runtime configs (no hardcode)
│   ├── app.config.yaml
│   ├── secrets.env
│   └── license.json
├── docs/
└── scripts/
```

## Configuration Philosophy

- **Nothing is hardcoded.** All settings live in `config/` or environment variables.
- `config/app.config.yaml` → feature flags, limits, business rules, i18n defaults
- `config/secrets.env` → API keys, DB passwords, JWT secrets, SMS credentials
- `config/license.json` → license key, company name, expiry, modules enabled

## Super Admin

The first user created via seed is Super Admin with full modular RBAC.
From the web panel you can create any role and assign granular permissions to every module (drivers, shifts, missions, inventory, finance, GIS, users, audit, ...).

## Security

- JWT with short-lived access + refresh rotation
- Rate limiting (global + per-endpoint)
- Helmet, CORS strict, input validation (class-validator)
- Idempotency keys for critical mutations
- Audit log for every sensitive action
- Mock GPS detection
- Ready for WAF (Coraza/OWASP CRS) in front of Traefik

## License

See `config/license.json`. When transferring ownership, update the license file.

## Language

Full bilingual (Persian + English). User can switch language in both mobile apps and web panel. All UI strings and server messages are i18n-ready.
