'use client';

import { useEffect, useState } from 'react';
import { productsApi, catalogApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type Ref = { id: string; code: string; name: string };
type Product = {
  id: string;
  code: string;
  name: string;
  unit?: string;
  unitRef?: Ref | null;
  warehouse?: Ref | null;
  categoryRef?: Ref | null;
  isActive: boolean;
};

export default function ProductsPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];
  const [items, setItems] = useState<Product[]>([]);
  const [units, setUnits] = useState<Ref[]>([]);
  const [warehouses, setWarehouses] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nextCode, setNextCode] = useState('');
  const [form, setForm] = useState({ name: '', unitId: '', warehouseId: '', categoryId: '' });
  const [transferFrom, setTransferFrom] = useState<string | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, u, w, c] = await Promise.all([
        productsApi.list(true),
        catalogApi.units(),
        catalogApi.warehouses(),
        catalogApi.categories(),
      ]);
      setItems(Array.isArray(p.data) ? p.data : []);
      setUnits(Array.isArray(u.data) ? u.data : []);
      setWarehouses(Array.isArray(w.data) ? w.data : []);
      setCategories(Array.isArray(c.data) ? c.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = async () => {
    setEditId(null);
    setForm({ name: '', unitId: '', warehouseId: '', categoryId: '' });
    setError('');
    try {
      const { data } = await productsApi.nextCode();
      setNextCode(data.code);
    } catch {
      setNextCode('auto');
    }
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setNextCode(p.code);
    setForm({
      name: p.name,
      unitId: (p as any).unitId || p.unitRef?.id || '',
      warehouseId: (p as any).warehouseId || p.warehouse?.id || '',
      categoryId: (p as any).categoryId || p.categoryRef?.id || '',
    });
    setShowForm(true);
    setError('');
  };

  const submit = async () => {
    setError('');
    try {
      if (editId) {
        await productsApi.update(editId, form);
      } else {
        await productsApi.create(form);
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف کالا؟ فقط اگر موجودی نداشته باشد.')) return;
    try {
      await productsApi.remove(id);
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Error';
      if (String(msg).includes('inventory') || String(msg).includes('Transfer')) {
        if (confirm(msg + '\nانتقال به کالای دیگر؟')) setTransferFrom(id);
      } else alert(msg);
    }
  };

  const doTransfer = async () => {
    if (!transferFrom || !transferTo) return;
    try {
      await productsApi.transfer(transferFrom, transferTo);
      setTransferFrom(null);
      setTransferTo('');
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.products}</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm text-white">
          <Plus size={16} /> {t.add}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="text-xs text-slate-500">کد کالا: <strong className="font-mono">{nextCode}</strong> {editId ? '' : '(خودکار)'}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="نام *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
              <option value="">واحد *</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
            </select>
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">انبار</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">دسته</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">{t.save}</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        </div>
      )}

      {transferFrom && (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-sm font-medium">انتقال موجودی به کالای دیگر</div>
          <select className="rounded-xl border px-3 py-2 text-sm bg-white" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
            <option value="">انتخاب کالای مقصد</option>
            {items.filter((p) => p.id !== transferFrom && p.isActive).map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={doTransfer} className="rounded-xl bg-amber-700 px-4 py-2 text-sm text-white">انتقال و غیرفعال‌سازی مبدأ</button>
            <button onClick={() => setTransferFrom(null)} className="rounded-xl border px-4 py-2 text-sm">انصراف</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">کد</th>
              <th className="px-4 py-3 text-start">نام</th>
              <th className="px-4 py-3 text-start">واحد</th>
              <th className="px-4 py-3 text-start">انبار</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
            ) : items.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.unitRef?.name || p.unit || '—'}</td>
                <td className="px-4 py-3">{p.warehouse?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200'}`}>
                    {p.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-lg border px-2 py-1 text-xs">ویرایش</button>
                    {p.isActive && (
                      <button onClick={() => remove(p.id)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600">حذف</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
