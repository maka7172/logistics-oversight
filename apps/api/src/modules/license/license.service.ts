import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface LicenseInfo {
  licenseKey: string;
  companyName: string;
  companyId: string;
  issuedAt: string;
  expiresAt: string;
  maxDrivers: number;
  maxVehicles: number;
  modules: Record<string, boolean>;
  features: Record<string, boolean>;
  signature?: string;
}

@Injectable()
export class LicenseService implements OnModuleInit {
  private readonly logger = new Logger(LicenseService.name);
  private license: LicenseInfo | null = null;

  onModuleInit() {
    this.loadLicense();
  }

  private loadLicense() {
    const paths = [
      join(process.cwd(), '../../config/license.json'),
      join(process.cwd(), '../config/license.json'),
      '/config/license.json',
    ];
    for (const p of paths) {
      if (existsSync(p)) {
        try {
          this.license = JSON.parse(readFileSync(p, 'utf8'));
          this.logger.log(`License loaded for: ${this.license?.companyName}`);
          return;
        } catch (e) {
          this.logger.warn(`Failed to parse license at ${p}`);
        }
      }
    }
    this.logger.warn('No license file found – running in development mode with all modules enabled');
    this.license = {
      licenseKey: 'DEV-MODE',
      companyName: 'Development',
      companyId: 'dev',
      issuedAt: new Date().toISOString(),
      expiresAt: '2099-12-31T23:59:59Z',
      maxDrivers: 9999,
      maxVehicles: 9999,
      modules: {
        driverApp: true,
        supervisorApp: true,
        webPanel: true,
        gis: true,
        vrp: true,
        realtime: true,
        offlineSync: true,
        finance: true,
        chat: true,
        sos: true,
        audit: true,
      },
      features: { multiTenant: false, whiteLabel: false },
    };
  }

  getLicense(): LicenseInfo {
    return this.license!;
  }

  isModuleEnabled(module: string): boolean {
    return !!this.license?.modules?.[module];
  }

  isExpired(): boolean {
    if (!this.license) return true;
    return new Date(this.license.expiresAt) < new Date();
  }
}
