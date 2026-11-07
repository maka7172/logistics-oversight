import { IsString, IsNotEmpty, Matches, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '09121234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/, { message: 'Phone must be a valid Iranian mobile number (09xxxxxxxxx)' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '09121234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^09\d{9}$/)
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appVersion?: string;
}
