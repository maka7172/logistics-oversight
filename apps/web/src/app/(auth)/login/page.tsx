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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-800 via-brand-700 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-white text-2xl font-bold mb-4">
            LO
          </div>
          <h1 className="text-2xl font-bold text-white">{t.appName}</h1>
          <p className="text-brand-100/80 mt-1 text-sm">Admin Panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.phone}</label>
                <input
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                />
              </div>
              <button
                onClick={requestOtp}
                disabled={loading || phone.length < 10}
                className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium py-3 transition disabled:opacity-50"
              >
                {loading ? t.loading : t.requestOtp}
              </button>
            </>
          ) : (
            <>
              {mockCode && (
                <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                  Mock OTP: <strong className="tracking-widest">{mockCode}</strong>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.otp}</label>
                <input
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center tracking-[0.4em] text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  placeholder="------"
                />
              </div>
              <button
                onClick={verify}
                disabled={loading || code.length < 4}
                className="w-full rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium py-3 transition disabled:opacity-50"
              >
                {loading ? t.loading : t.verify}
              </button>
              <button
                onClick={() => { setStep('phone'); setCode(''); setMockCode(null); }}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                ← تغییر شماره
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
