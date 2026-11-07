import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

  private get provider(): string {
    return (
      this.config.get<string>('otp.provider') ||
      process.env.OTP_PROVIDER ||
      'mock'
    ).toLowerCase();
  }

  private get length(): number {
    return Number(this.config.get('otp.length') || process.env.OTP_LENGTH || 6);
  }

  private get expiresSeconds(): number {
    return Number(this.config.get('otp.expiresSeconds') || process.env.OTP_EXPIRES_SECONDS || 120);
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

    if (this.provider === 'mock') {
      this.logger.log(`[MOCK OTP] phone=${normalized} code=${code}`);
      return { success: true, message: 'OTP sent (mock mode)', mockCode: code };
    }

    if (this.provider === 'smsir' || this.provider === 'sms.ir') {
      const apiKey = process.env.SMSIR_API_KEY || process.env.SMS_IR_API_KEY;
      const templateId = process.env.SMSIR_TEMPLATE_ID || process.env.SMS_IR_TEMPLATE_ID;
      const line = process.env.SMSIR_LINE_NUMBER || process.env.SMS_IR_LINE_NUMBER;

      if (!apiKey) {
        this.logger.warn('SMSIR_API_KEY missing – fallback mock');
        return {
          success: true,
          message: 'OTP sent (fallback mock – set SMSIR_API_KEY)',
          mockCode: code,
        };
      }

      try {
        // sms.ir Verify API (template-based)
        // Docs: https://console.sms.ir — Web Service
        const body: any = {
          mobile: normalized.replace(/^0/, '0'), // keep local format; many templates expect 09...
          templateId: templateId ? Number(templateId) : undefined,
          parameters: [
            { name: 'CODE', value: code },
            { name: 'code', value: code },
          ],
        };
        // If only line-based send is configured without template, still try verify
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
          this.logger.error(`SMS.ir error status=${res.status} body=${JSON.stringify(data)} line=${line || '-'}`);
          // keep code in store so verify still works if user reads from panel; surface error
          throw new BadRequestException(
            data?.message || 'ارسال پیامک ناموفق بود. کلید/قالب sms.ir را بررسی کنید',
          );
        }
        this.logger.log(`[SMS.ir] OTP sent to ${normalized}`);
        return { success: true, message: 'OTP sent via SMS.ir' };
      } catch (e: any) {
        if (e instanceof BadRequestException) throw e;
        this.logger.error(`SMS.ir request failed: ${e?.message || e}`);
        throw new BadRequestException('خطا در ارتباط با سرویس پیامک');
      }
    }

    throw new BadRequestException('Unknown OTP provider');
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
    if (record.code !== code.trim()) return false;
    this.store.delete(normalized);
    return true;
  }
}
