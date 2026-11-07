import { Module, Global } from '@nestjs/common';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';

@Global()
@Module({
  providers: [LicenseService],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicenseModule {}
