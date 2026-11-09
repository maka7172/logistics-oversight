import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private store = new Map<string, OtpRecord>();

  constructor(private config: ConfigService) {}

  /** env has priority over yaml */
  private get provider(): string {
    const fromEnv = process.env.OTP_PROVIDER;
    const fromYaml = this.config.get<string>('otp.provider');
    return (fromEnv || fromYaml || 'mock').toLowerCase().trim();
  }

  private get length(): number {
    return Number(process.env.OTP_LENGTH || this.config.get('otp.length') || 6);
  }

  private get expiresSeconds(): number {
    return Number(process.env.OTP_EXPIRES_SECONDS || this.config.get('otp.expiresSeconds') || 120);
  }

  private generateCode(): string {
    const max = 10 ** this.length;
    const n = Math.floor(Math.random() * max);
    return n.toString().padStart(this.length, '0');
  }

  async sendOtp(phone: string): Promise<{ success: boolean; message: string; mockCode?: string }> {
    const normalized = phone.replace(/\s+/g, '');
    const code = this.generateCode();
    const expiresAt = Date.now() + this.expiresSeconds * 1000;
    this.store.set(normalized, { code, expiresAt, attempts: 0 });

    const provider = this.provider;
    const isProd = process.env.NODE_ENV === 'production';

    if (provider === 'mock') {
      if (isProd) {
        throw new ServiceUnavailableException('OTP mock is disabled in production. Set OTP_PROVIDER=smsir');
      }
      this.logger.log(`[MOCK OTP] phone=${normalized} code=${code}`);
      return { success: true, message: 'OTP sent (mock mode)', mockCode: code };
    }

    if (provider === 'smsir' || provider === 'sms.ir') {
      const apiKey = (process.env.SMSIR_API_KEY || process.env.SMS_IR_API_KEY || '').trim();
      const templateId = (process.env.SMSIR_TEMPLATE_ID || process.env.SMS_IR_TEMPLATE_ID || '').trim();

      if (!apiKey || !templateId) {
        this.logger.error('SMSIR_API_KEY or SMSIR_TEMPLATE_ID missing');
        if (isProd) {
          throw new ServiceUnavailableException('SMS provider is not configured');
        }
        // In development only: explicit fail message, NO silent mock with success path confusion
        throw new BadRequestException(
          'SMS.ir تنظیم نشده: SMSIR_API_KEY و SMSIR_TEMPLATE_ID را در .env بگذارید (یا OTP_PROVIDER=mock برای تست)',
        );
      }

      try {
        const body = {
          mobile: normalized,
          templateId: Number(templateId),
          parameters: [
            { name: 'CODE', value: code },
            
          ],
        };
        const res = await fetch('https://api.sms.ir/v1/send/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify(body),
        });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok || data?.status !== 1) {
          this.logger.error(`SMS.ir error status=${res.status} body=${JSON.stringify(data)}`);
          throw new BadRequestException(data?.message || 'ارسال پیامک ناموفق بود');
        }
        this.logger.log(`[SMS.ir] OTP sent to ${normalized}`);
        return { success: true, message: 'OTP sent via SMS.ir' };
      } catch (e: any) {
        if (e instanceof BadRequestException || e instanceof ServiceUnavailableException) throw e;
        this.logger.error(`SMS.ir request failed: ${e?.message || e}`);
        throw new BadRequestException('خطا در ارتباط با سرویس پیامک');
      }
    }

    throw new BadRequestException(`Unknown OTP provider: ${provider}`);
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const normalized = phone.replace(/\s+/g, '');
    const record = this.store.get(normalized);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      this.store.delete(normalized);
      return false;
    }
    record.attempts += 1;
    if (record.attempts > 5) {
      this.store.delete(normalized);
      return false;
    }
    if (record.code !== String(code).trim()) return false;
    this.store.delete(normalized);
    return true;
  }
}
