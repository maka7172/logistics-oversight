import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      service: 'logistics-oversight-api',
    };
  }

  @Public()
  @Get('ready')
  ready() {
    // Later: check DB, Redis, etc.
    return { status: 'ready' };
  }
}
