'use client';

import { useEffect, useState } from 'react';
import { missionsApi, shiftsApi, customersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type Mission = {
  id: string;
  status: string;
  seq: number;
  plannedAmount?: number;
  deliveredAmount?: number;
  collectedAmount?: number;
  customer?: { name: string; phone?: string };
};

type Shift = { id: string; status: string; driver?: { user?: { fullName: string } } };
type Customer = { id: string; name: string };

export default function MissionsPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shiftId, setShiftId] = useState('');
  const [items, setItems] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: '', seq: '1', plannedAmount: '0' });
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, c] = await Promise.all([shiftsApi.list(), customersApi.list()]);
        setShifts(Array.isArray(s.data) ? s.data : []);
        setCustomers(Array.isArray(c.data) ? c.data : []);
      } catch { /* ignore */ }
    })();
  }, []);

  const loadMissions = async (sid: string) => {
    if (!sid) { setItems([]); return; }
    setLoading(true);
    try {
      const { data } = await missionsApi.byShift(sid);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMissions(shiftId); }, [shiftId]);

  const create = async () => {
    setError('');
    try {
      await missionsApi.create({
        shiftId,
        customerId: form.customerId,
        seq: Number(form.seq) || 0,
        plannedAmount: Number(form.plannedAmount) || 0,
      });
      setShowForm(false);
      setForm({ customerId: '', seq: '1', plannedAmount: '0' });
      loadMissions(shiftId);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t.missions}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border bg-white px-3 py-2 text-sm min-w-[220px]"
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
          >
            <option value="">انتخاب شیفت</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.driver?.user?.fullName || s.id.slice(0, 8)} — {s.status}
              </option>
            ))}
          </select>
          <button
            disabled={!shiftId}
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            <Plus size={16} /> مأموریت
          </button>
        </div>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">مشتری *</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="ترتیب" value={form.seq} onChange={(e) => setForm({ ...form, seq: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" type="number" placeholder="مبلغ برنامه‌ریزی‌شده" value={form.plannedAmount} onChange={(e) => setForm({ ...form, plannedAmount: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={!form.customerId} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50">{t.save}</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">#</th>
              <th className="px-4 py-3 text-start">مشتری</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">برنامه</th>
              <th className="px-4 py-3 text-start">تحویل / وصول</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!shiftId ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">ابتدا یک شیفت انتخاب کنید</td></tr>
            ) : loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
            ) : items.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{m.seq}</td>
                <td className="px-4 py-3 font-medium">{m.customer?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs">{m.status}</span>
                </td>
                <td className="px-4 py-3">{Number(m.plannedAmount || 0).toLocaleString('fa-IR')}</td>
                <td className="px-4 py-3 text-slate-600">
                  {Number(m.deliveredAmount || 0).toLocaleString('fa-IR')} / {Number(m.collectedAmount || 0).toLocaleString('fa-IR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
