'use client';

import { useEffect, useState } from 'react';
import { auditApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';

type Log = {
  id: string;
  userPhone?: string;
  userName?: string;
  action: string;
  module: string;
  entityId?: string;
  summary?: string;
  createdAt: string;
};

export default function AuditPage() {
  const locale = useAuthStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const t = messages[locale];
  const [items, setItems] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canView = user?.isSuperAdmin || user?.permissions?.includes('audit:read') || user?.permissions?.includes('*');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await auditApi.list({ take: 200 });
        setItems(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'دسترسی ندارید');
      } finally {
        setLoading(false);
      }
    })();
  }, [canView]);

  if (!canView) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">
        فقط سوپر ادمین به لاگ سیستم دسترسی دارد.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{(t as any).audit || 'لاگ سیستم'}</h1>
        <p className="text-xs text-slate-400 mt-1">غیرقابل حذف و ویرایش</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">زمان</th>
              <th className="px-4 py-3 text-start">کاربر</th>
              <th className="px-4 py-3 text-start">عملیات</th>
              <th className="px-4 py-3 text-start">ماژول</th>
              <th className="px-4 py-3 text-start">خلاصه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
            ) : items.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleString('fa-IR')}
                </td>
                <td className="px-4 py-3">{l.userName || l.userPhone || '—'}</td>
                <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{l.action}</span></td>
                <td className="px-4 py-3">{l.module}</td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{l.summary || l.entityId || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
