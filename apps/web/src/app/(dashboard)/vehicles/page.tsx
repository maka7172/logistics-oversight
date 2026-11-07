'use client';

import { useEffect, useState } from 'react';
import { vehiclesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type VType = { id: string; code: string; name: string; nameEn?: string };
type Vehicle = {
  id: string;
  plateNumber: string;
  brand?: string;
  model?: string;
  color?: string;
  vehicleType?: VType | null;
  isActive: boolean;
};

export default function VehiclesPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];
  const [types, setTypes] = useState<VType[]>([]);
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'list' | 'types'>('list');
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [typeForm, setTypeForm] = useState({ code: '', name: '', nameEn: '' });
  const [form, setForm] = useState({
    plateNumber: '',
    vehicleTypeId: '',
    brand: '',
    model: '',
    color: '',
  });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, vRes] = await Promise.all([vehiclesApi.listTypes(), vehiclesApi.list()]);
      setTypes(Array.isArray(tRes.data) ? tRes.data : []);
      setItems(Array.isArray(vRes.data) ? vRes.data : []);
    } catch {
      setTypes([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitType = async () => {
    setError('');
    try {
      await vehiclesApi.createType(typeForm);
      setShowTypeForm(false);
      setTypeForm({ code: '', name: '', nameEn: '' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  const submitVehicle = async () => {
    setError('');
    try {
      await vehiclesApi.create({
        ...form,
        vehicleTypeId: form.vehicleTypeId || null,
      });
      setShowForm(false);
      setForm({ plateNumber: '', vehicleTypeId: '', brand: '', model: '', color: '' });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{t.vehicles}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('list')}
            className={`rounded-xl px-3 py-2 text-sm ${tab === 'list' ? 'bg-brand-700 text-white' : 'border bg-white'}`}
          >
            لیست وسایل
          </button>
          <button
            onClick={() => setTab('types')}
            className={`rounded-xl px-3 py-2 text-sm ${tab === 'types' ? 'bg-brand-700 text-white' : 'border bg-white'}`}
          >
            انواع وسیله
          </button>
          {tab === 'list' ? (
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">
              <Plus size={16} /> {t.add}
            </button>
          ) : (
            <button onClick={() => setShowTypeForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">
              <Plus size={16} /> نوع جدید
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {showTypeForm && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="کد (motor)" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="نام (موتور)" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="English name" value={typeForm.nameEn} onChange={(e) => setTypeForm({ ...typeForm, nameEn: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={submitType} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">{t.save}</button>
            <button onClick={() => setShowTypeForm(false)} className="rounded-xl border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="پلاک" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.vehicleTypeId} onChange={(e) => setForm({ ...form, vehicleTypeId: e.target.value })}>
              <option value="">نوع وسیله (اختیاری)</option>
              {types.map((tp) => (
                <option key={tp.id} value={tp.id}>{tp.name}</option>
              ))}
            </select>
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="برند" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="مدل" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="رنگ" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={submitVehicle} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white">{t.save}</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {tab === 'types' ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start">کد</th>
                <th className="px-4 py-3 text-start">نام</th>
                <th className="px-4 py-3 text-start">EN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
              ) : types.map((tp) => (
                <tr key={tp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{tp.code}</td>
                  <td className="px-4 py-3 font-medium">{tp.name}</td>
                  <td className="px-4 py-3 text-slate-500">{tp.nameEn || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-start">پلاک</th>
                <th className="px-4 py-3 text-start">نوع</th>
                <th className="px-4 py-3 text-start">برند / مدل</th>
                <th className="px-4 py-3 text-start">رنگ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
              ) : items.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{v.plateNumber}</td>
                  <td className="px-4 py-3">{v.vehicleType?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{[v.brand, v.model].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-4 py-3">{v.color || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
