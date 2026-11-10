'use client';

import { useEffect, useState } from 'react';
import { shiftsApi, driversApi, productsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type Shift = {
  id: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  openingCashFloat?: number;
  driver?: { id: string; user?: { fullName: string; phone: string } };
  vehicle?: { plateNumber: string } | null;
};
type Driver = { id: string; user?: { fullName: string; phone: string } };
type Product = { id: string; code: string; name: string };
type Inv = { id: string; product?: { name: string; code: string }; openingQty: number; deliveredQty: number; remainingQty: number };
type LoadRec = { id: string; status: string; openingCash: number; lines?: { productId: string; qty: number; product?: { name: string } }[] };

const statusColor: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  ready: 'bg-sky-100 text-sky-800',
  active: 'bg-emerald-100 text-emerald-800',
  closing: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-200 text-slate-600',
};

export default function ShiftsPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];
  const [items, setItems] = useState<Shift[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [driverId, setDriverId] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Shift | null>(null);
  const [inventory, setInventory] = useState<Inv[]>([]);
  const [loads, setLoads] = useState<LoadRec[]>([]);
  const [showLoad, setShowLoad] = useState(false);
  const [openingCash, setOpeningCash] = useState('0');
  const [lines, setLines] = useState<{ productId: string; qty: string }[]>([{ productId: '', qty: '1' }]);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, d, p] = await Promise.all([shiftsApi.list(), driversApi.list(), productsApi.list()]);
      setItems(Array.isArray(s.data) ? s.data : []);
      setDrivers(Array.isArray(d.data) ? d.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (s: Shift) => {
    setSelected(s);
    try {
      const [inv, ld] = await Promise.all([
        shiftsApi.inventory(s.id),
        shiftsApi.listLoads(s.id),
      ]);
      setInventory(Array.isArray(inv.data) ? inv.data : []);
      setLoads(Array.isArray(ld.data) ? ld.data : []);
    } catch {
      setInventory([]);
      setLoads([]);
    }
  };

  const create = async () => {
    setError('');
    try {
      await shiftsApi.create({ driverId });
      setShowForm(false);
      setDriverId('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  const submitLoad = async () => {
    if (!selected) return;
    setError('');
    try {
      await shiftsApi.createLoad(selected.id, {
        openingCash: Number(openingCash) || 0,
        lines: lines.filter((l) => l.productId).map((l) => ({ productId: l.productId, qty: Number(l.qty) || 0 })),
      });
      setShowLoad(false);
      setLines([{ productId: '', qty: '1' }]);
      setOpeningCash('0');
      openDetail(selected);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  const approve = async (recordId: string) => {
    try {
      await shiftsApi.approveLoad(recordId);
      if (selected) openDetail(selected);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error');
    }
  };

  const start = async (id: string) => {
    setActionId(id);
    try {
      await shiftsApi.start(id);
      load();
      if (selected?.id === id) {
        const { data } = await shiftsApi.get(id);
        setSelected(data);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error');
    } finally {
      setActionId(null);
    }
  };

  const close = async (id: string) => {
    const cash = prompt('مبلغ نقد گزارش‌شده؟', '0');
    if (cash === null) return;
    setActionId(id);
    try {
      await shiftsApi.close(id, { closingCashReported: Number(cash) || 0 });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.shifts}</h1>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm text-white">
          <Plus size={16} /> شیفت جدید
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <select className="w-full max-w-md rounded-xl border px-3 py-2 text-sm" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">انتخاب راننده</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.user?.fullName || d.id} — {d.user?.phone}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={create} disabled={!driverId} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50">{t.save}</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">راننده</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">وسیله</th>
              <th className="px-4 py-3 text-start">شروع</th>
              <th className="px-4 py-3 text-start">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
            ) : items.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{s.driver?.user?.fullName || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[s.status] || 'bg-slate-100'}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3">{s.vehicle?.plateNumber || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{s.startedAt ? new Date(s.startedAt).toLocaleString('fa-IR') : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => openDetail(s)} className="rounded-lg border px-2 py-1 text-xs">جزئیات / بار</button>
                    {s.status === 'ready' && (
                      <button disabled={actionId === s.id} onClick={() => start(s.id)} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white">شروع</button>
                    )}
                    {(s.status === 'active' || s.status === 'closing') && (
                      <button disabled={actionId === s.id} onClick={() => close(s.id)} className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-white">بستن</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">شیفت {selected.driver?.user?.fullName} — {selected.status}</h2>
            <div className="flex gap-2">
              {(selected.status === 'pending' || selected.status === 'ready') && (
                <button onClick={() => setShowLoad(true)} className="rounded-xl bg-brand-700 px-3 py-1.5 text-sm text-white">ثبت بار</button>
              )}
              <button onClick={() => setSelected(null)} className="rounded-xl border px-3 py-1.5 text-sm">بستن پنل</button>
            </div>
          </div>

          {showLoad && (
            <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
              {error && <div className="text-sm text-red-600">{error}</div>}
              <input className="rounded-xl border px-3 py-2 text-sm bg-white" type="number" placeholder="تنخواه / نقد اولیه" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
              {lines.map((line, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <select className="rounded-xl border px-3 py-2 text-sm bg-white min-w-[180px]" value={line.productId} onChange={(e) => {
                    const n = [...lines]; n[i] = { ...n[i], productId: e.target.value }; setLines(n);
                  }}>
                    <option value="">کالا</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                  </select>
                  <input className="rounded-xl border px-3 py-2 text-sm bg-white w-24" type="number" value={line.qty} onChange={(e) => {
                    const n = [...lines]; n[i] = { ...n[i], qty: e.target.value }; setLines(n);
                  }} />
                </div>
              ))}
              <button type="button" className="text-xs text-brand-700" onClick={() => setLines([...lines, { productId: '', qty: '1' }])}>+ ردیف کالا</button>
              <div className="flex gap-2">
                <button onClick={submitLoad} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">ذخیره بار</button>
                <button onClick={() => setShowLoad(false)} className="rounded-xl border px-4 py-2 text-sm">انصراف</button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium mb-2">سوابق بار</h3>
            {loads.length === 0 ? <p className="text-xs text-slate-400">باری ثبت نشده</p> : (
              <ul className="space-y-2">
                {loads.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                    <span>وضعیت: {l.status} | تنخواه: {Number(l.openingCash || 0).toLocaleString('fa-IR')} | اقلام: {l.lines?.length || 0}</span>
                    {l.status !== 'approved' && (
                      <button onClick={() => approve(l.id)} className="rounded-lg bg-sky-600 px-2 py-1 text-xs text-white">تأیید نهایی</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">موجودی شیفت</h3>
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr>
                <th className="px-2 py-2 text-start">کالا</th>
                <th className="px-2 py-2 text-start">اولیه</th>
                <th className="px-2 py-2 text-start">تحویل</th>
                <th className="px-2 py-2 text-start">مانده</th>
              </tr></thead>
              <tbody className="divide-y">
                {inventory.length === 0 ? (
                  <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-400">—</td></tr>
                ) : inventory.map((i) => (
                  <tr key={i.id}>
                    <td className="px-2 py-2">{i.product?.name || i.product?.code || '—'}</td>
                    <td className="px-2 py-2">{i.openingQty}</td>
                    <td className="px-2 py-2">{i.deliveredQty}</td>
                    <td className="px-2 py-2">{i.remainingQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
