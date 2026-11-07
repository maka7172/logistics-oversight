import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @ApiOperation({ summary: 'Request OTP for login' })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @ApiOperation({ summary: 'Verify OTP and receive JWT' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }
}
