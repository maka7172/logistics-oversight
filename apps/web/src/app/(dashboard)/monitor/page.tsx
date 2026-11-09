'use client';

import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';

type Row = {
  driverId?: string;
  fullName?: string;
  phone?: string;
  driverRoleLabel?: string;
  lastLocation: { lat: number; lng: number; speed?: number; recordedAt: string } | null;
  activeShiftId: string | null;
  shiftStatus: string | null;
  // legacy nested shape
  driver?: { id: string; user?: { fullName: string; phone: string } };
};

export default function MonitorPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale] as any;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await reportsApi.liveDrivers();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.monitor || 'پایش زنده'}</h1>
          <p className="text-xs text-slate-400">به‌روزرسانی هر ۱۵ ثانیه — موقعیت از پینگ اپ راننده</p>
        </div>
        <button onClick={load} className="rounded-xl border px-3 py-2 text-sm">تازه‌سازی</button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">راننده</th>
              <th className="px-4 py-3 text-start">شیفت</th>
              <th className="px-4 py-3 text-start">موقعیت</th>
              <th className="px-4 py-3 text-start">سرعت</th>
              <th className="px-4 py-3 text-start">آخرین ارسال</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">راننده‌ای نیست یا هنوز پینگی ارسال نشده</td></tr>
            ) : rows.map((r, i) => {
              const name = r.fullName || r.driver?.user?.fullName || '—';
              const phone = r.phone || r.driver?.user?.phone || '';
              const key = r.driverId || r.driver?.id || String(i);
              return (
                <tr key={key} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{name}
                    <div className="text-xs text-slate-400 dir-ltr text-left">{phone}</div>
                  </td>
                  <td className="px-4 py-3">{r.shiftStatus || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.lastLocation ? `${Number(r.lastLocation.lat).toFixed(5)}, ${Number(r.lastLocation.lng).toFixed(5)}` : '—'}
                  </td>
                  <td className="px-4 py-3">{r.lastLocation?.speed != null ? `${r.lastLocation.speed}` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.lastLocation?.recordedAt ? new Date(r.lastLocation.recordedAt).toLocaleString('fa-IR') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
