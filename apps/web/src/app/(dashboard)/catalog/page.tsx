'use client';

import { useEffect, useState } from 'react';
import { catalogApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type Row = { id: string; code: string; name: string; nameEn?: string; address?: string; isActive: boolean };

export default function CatalogPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];
  const [tab, setTab] = useState<'units' | 'warehouses' | 'categories'>('units');
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', nameEn: '', address: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const fn = tab === 'units' ? catalogApi.units : tab === 'warehouses' ? catalogApi.warehouses : catalogApi.categories;
      const { data } = await fn(true);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const submit = async () => {
    setError('');
    try {
      if (tab === 'units') await catalogApi.createUnit({ code: form.code, name: form.name, nameEn: form.nameEn || undefined });
      else if (tab === 'warehouses') await catalogApi.createWarehouse({ code: form.code, name: form.name, address: form.address || undefined });
      else await catalogApi.createCategory({ code: form.code, name: form.name });
      setShow(false);
      setForm({ code: '', name: '', nameEn: '', address: '' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm('غیرفعال شود؟')) return;
    try {
      if (tab === 'units') await catalogApi.updateUnit(id, { isActive: false });
      else if (tab === 'warehouses') await catalogApi.updateWarehouse(id, { isActive: false });
      else await catalogApi.updateCategory(id, { isActive: false });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{(t as any).catalog || 'داده مرجع'}</h1>
        <div className="flex flex-wrap gap-2">
          {(['units', 'warehouses', 'categories'] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-xl px-3 py-2 text-sm ${tab === k ? 'bg-brand-700 text-white' : 'border bg-white'}`}>
              {k === 'units' ? 'واحدها' : k === 'warehouses' ? 'انبارها' : 'دسته‌ها'}
            </button>
          ))}
          <button onClick={() => setShow(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">
            <Plus size={16} /> افزودن
          </button>
        </div>
      </div>

      {show && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="کد *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="نام *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {tab === 'units' && <input className="rounded-xl border px-3 py-2 text-sm" placeholder="EN" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />}
            {tab === 'warehouses' && <input className="rounded-xl border px-3 py-2 text-sm" placeholder="آدرس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />}
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">{t.save}</button>
            <button onClick={() => setShow(false)} className="rounded-xl border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">کد</th>
              <th className="px-4 py-3 text-start">نام</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${r.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200'}`}>
                    {r.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.isActive && (
                    <button onClick={() => deactivate(r.id)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600">غیرفعال</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
