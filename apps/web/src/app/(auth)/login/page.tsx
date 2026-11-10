'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];

  const [phone, setPhone] = useState('09120000000');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [mockCode, setMockCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.requestOtp(phone);
      if (data.mockCode) setMockCode(data.mockCode);
      setStep('otp');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(phone, code);
      setAuth(data.accessToken, {
        id: data.user.id,
        phone: data.user.phone,
        fullName: data.user.fullName,
        preferredLocale: data.user.preferredLocale || 'fa',
        isSuperAdmin: data.user.isSuperAdmin,
        roles: data.user.roles || [],
        permissions: data.user.permissions || [],
      });
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-[#3a120a] to-brand-500 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/brand/combination.png"
            alt="ROOK"
            className="mx-auto mb-4 h-20 w-[72px] rounded-2xl object-cover shadow-2xl ring-1 ring-white/15"
          />
          <h1 className="text-3xl font-extrabold tracking-[0.25em] text-white">ROOK</h1>
          <p className="text-white/70 mt-2 text-sm">Admin Panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>
          )}

          {step === 'phone' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t.phone || 'شماره موبایل'}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  dir="ltr"
                  placeholder="09xxxxxxxxx"
                />
              </div>
              <button
                onClick={requestOtp}
                disabled={loading}
                className="w-full rounded-xl bg-brand-500 hover:bg-brand-700 text-white font-medium py-3 transition disabled:opacity-50"
              >
                {loading ? '...' : t.requestOtp || 'دریافت کد'}
              </button>
            </>
          ) : (
            <>
              {mockCode && (
                <div className="rounded-xl bg-amber-50 text-amber-800 text-sm px-3 py-2 text-center">
                  Mock OTP: <b>{mockCode}</b>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t.otp || 'کد تأیید'}
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center tracking-[0.4em] text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  dir="ltr"
                  placeholder="------"
                />
              </div>
              <button
                onClick={verify}
                disabled={loading}
                className="w-full rounded-xl bg-brand-500 hover:bg-brand-700 text-white font-medium py-3 transition disabled:opacity-50"
              >
                {loading ? '...' : t.login || 'ورود'}
              </button>
              <button
                onClick={() => {
                  setStep('phone');
                  setCode('');
                }}
                className="w-full text-sm text-slate-500 hover:text-brand-700"
              >
                {t.changePhone || 'تغییر شماره'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
