'use client';

import { useEffect, useState } from 'react';
import { customersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type Customer = {
  id: string;
  code?: string;
  name: string;
  phone?: string;
  address?: string;
  outstandingDebt?: number;
  isActive: boolean;
};

export default function CustomersPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await customersApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    setError('');
    try {
      await customersApi.create(form);
      setShowForm(false);
      setForm({ code: '', name: '', phone: '', address: '' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.customers}</h1>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm text-white">
          <Plus size={16} /> {t.add}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="کد" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="نام *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" dir="ltr" placeholder="موبایل" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="آدرس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">{t.save}</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">کد</th>
              <th className="px-4 py-3 text-start">نام</th>
              <th className="px-4 py-3 text-start">موبایل</th>
              <th className="px-4 py-3 text-start">بدهی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
            ) : items.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{c.code || '—'}</td>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 dir-ltr text-left">{c.phone || '—'}</td>
                <td className="px-4 py-3">{Number(c.outstandingDebt || 0).toLocaleString('fa-IR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
