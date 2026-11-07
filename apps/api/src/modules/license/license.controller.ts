import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LicenseService } from './license.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('License')
@ApiBearerAuth()
@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  @Permissions('license:read')
  getLicense() {
    const lic = this.licenseService.getLicense();
    // Never expose signature or full key in response if sensitive
    return {
      companyName: lic.companyName,
      expiresAt: lic.expiresAt,
      maxDrivers: lic.maxDrivers,
      maxVehicles: lic.maxVehicles,
      modules: lic.modules,
      features: lic.features,
      isExpired: this.licenseService.isExpired(),
    };
  }
}
