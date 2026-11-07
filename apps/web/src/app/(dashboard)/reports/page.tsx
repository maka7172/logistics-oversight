'use client';

import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import Link from 'next/link';

type Tab = 'shifts' | 'missions' | 'audit';

export default function ReportsPage() {
  const locale = useAuthStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const t = messages[locale] as any;
  const [tab, setTab] = useState<Tab>('shifts');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canAudit = user?.isSuperAdmin || (user?.permissions || []).includes('*') || (user?.permissions || []).includes('audit:read');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (tab === 'shifts') {
          const { data } = await reportsApi.shifts();
          setRows(Array.isArray(data) ? data : []);
        } else if (tab === 'missions') {
          const { data } = await reportsApi.missions();
          setRows(Array.isArray(data) ? data : []);
        } else if (tab === 'audit' && canAudit) {
          const { data } = await reportsApi.audit(200);
          setRows(Array.isArray(data) ? data : []);
        } else setRows([]);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [tab, canAudit]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.reports || 'گزارشات'}</h1>
        <p className="text-xs text-slate-400">گزارشات مدیریتی — لاگ فقط برای سوپرادمین</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab('shifts')} className={`rounded-xl px-3 py-2 text-sm ${tab === 'shifts' ? 'bg-brand-700 text-white' : 'border bg-white'}`}>شیفت‌ها</button>
        <button onClick={() => setTab('missions')} className={`rounded-xl px-3 py-2 text-sm ${tab === 'missions' ? 'bg-brand-700 text-white' : 'border bg-white'}`}>مأموریت‌ها</button>
        {canAudit && (
          <button onClick={() => setTab('audit')} className={`rounded-xl px-3 py-2 text-sm ${tab === 'audit' ? 'bg-brand-700 text-white' : 'border bg-white'}`}>لاگ سیستم</button>
        )}
        <Link href="/monitor" className="rounded-xl border bg-white px-3 py-2 text-sm">پایش زنده ←</Link>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {tab === 'shifts' && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>
              <th className="px-4 py-3 text-start">راننده</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">شروع</th>
              <th className="px-4 py-3 text-start">پایان</th>
            </tr></thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
              : rows.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
              : rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{s.driver?.user?.fullName || '—'}</td>
                  <td className="px-4 py-3">{s.status}</td>
                  <td className="px-4 py-3 text-xs">{s.startedAt ? new Date(s.startedAt).toLocaleString('fa-IR') : '—'}</td>
                  <td className="px-4 py-3 text-xs">{s.endedAt ? new Date(s.endedAt).toLocaleString('fa-IR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'missions' && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>
              <th className="px-4 py-3 text-start">مشتری</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">تحویل</th>
              <th className="px-4 py-3 text-start">وصول</th>
            </tr></thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
              : rows.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
              : rows.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{m.customer?.name || '—'}</td>
                  <td className="px-4 py-3">{m.status}</td>
                  <td className="px-4 py-3">{Number(m.deliveredAmount || 0).toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3">{Number(m.collectedAmount || 0).toLocaleString('fa-IR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'audit' && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>
              <th className="px-4 py-3 text-start">زمان</th>
              <th className="px-4 py-3 text-start">کاربر</th>
              <th className="px-4 py-3 text-start">عملیات</th>
              <th className="px-4 py-3 text-start">ماژول</th>
              <th className="px-4 py-3 text-start">خلاصه</th>
            </tr></thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
              : rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">هنوز لاگی ثبت نشده (با عملیات بعدی پر می‌شود)</td></tr>
              : rows.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{new Date(l.createdAt).toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3">{l.userName || l.userPhone || '—'}</td>
                  <td className="px-4 py-3">{l.action}</td>
                  <td className="px-4 py-3">{l.module}</td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{l.summary || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
