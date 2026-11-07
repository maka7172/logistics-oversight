import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Permissions('audit:read')
  @ApiOperation({ summary: 'List audit logs (super admin / audit:read only). Immutable.' })
  list(
    @Query('module') module?: string,
    @Query('userId') userId?: string,
    @Query('take') take?: string,
  ) {
    return this.service.list({
      module,
      userId,
      take: take ? parseInt(take, 10) : 200,
    });
  }
}
