'use client';

import { useEffect, useState } from 'react';
import { driversApi, vehiclesApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type Driver = {
  id: string;
  personnelCode?: string;
  driverRoleLabel?: string;
  licenseNumber?: string;
  isActive: boolean;
  user?: { id: string; phone: string; fullName: string };
  assignedVehicle?: { plateNumber: string } | null;
};

type UserRow = { id: string; phone: string; fullName: string };
type VType = { id: string; name: string };
type Vehicle = { id: string; plateNumber: string };

export default function DriversPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];
  const [items, setItems] = useState<Driver[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [types, setTypes] = useState<VType[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    userId: '',
    personnelCode: '',
    driverRoleLabel: '',
    preferredVehicleTypeId: '',
    assignedVehicleId: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [d, u, vt, v] = await Promise.all([
        driversApi.list(),
        usersApi.list(true),
        vehiclesApi.listTypes(),
        vehiclesApi.available().catch(() => vehiclesApi.list()),
      ]);
      setItems(Array.isArray(d.data) ? d.data : []);
      setUsers(Array.isArray(u.data) ? u.data : []);
      setTypes(Array.isArray(vt.data) ? vt.data : []);
      setVehicles(Array.isArray(v.data) ? v.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const linkedUserIds = new Set(items.map((d) => d.user?.id).filter(Boolean));
  const availableUsers = users.filter((u) => !linkedUserIds.has(u.id) || form.userId === u.id);

  const openCreate = () => {
    setEditId(null);
    setForm({
      userId: '',
      personnelCode: '',
      driverRoleLabel: '',
      preferredVehicleTypeId: '',
      assignedVehicleId: '',
      licenseNumber: '',
    });
    setShowForm(true);
    setError('');
  };

  const openEdit = (d: Driver) => {
    setEditId(d.id);
    setForm({
      userId: d.user?.id || '',
      personnelCode: d.personnelCode || '',
      driverRoleLabel: d.driverRoleLabel || '',
      preferredVehicleTypeId: '',
      assignedVehicleId: '',
      licenseNumber: d.licenseNumber || '',
    });
    setShowForm(true);
    setError('');
  };

  const submit = async () => {
    setError('');
    try {
      if (editId) {
        await driversApi.update(editId, {
          personnelCode: form.personnelCode || null,
          driverRoleLabel: form.driverRoleLabel || null,
          preferredVehicleTypeId: form.preferredVehicleTypeId || null,
          assignedVehicleId: form.assignedVehicleId || null,
          licenseNumber: form.licenseNumber || null,
        });
      } else {
        await driversApi.create({
          userId: form.userId,
          personnelCode: form.personnelCode || undefined,
          driverRoleLabel: form.driverRoleLabel || undefined,
          preferredVehicleTypeId: form.preferredVehicleTypeId || undefined,
          assignedVehicleId: form.assignedVehicleId || undefined,
          licenseNumber: form.licenseNumber || undefined,
        });
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.drivers}</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm text-white">
          <Plus size={16} /> {t.add}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!editId && (
              <select
                className="rounded-xl border px-3 py-2 text-sm"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
              >
                <option value="">انتخاب کاربر *</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} — {u.phone}
                  </option>
                ))}
              </select>
            )}
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="کد پرسنلی" value={form.personnelCode} onChange={(e) => setForm({ ...form, personnelCode: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="نقش اختیاری (راننده موتور...)" value={form.driverRoleLabel} onChange={(e) => setForm({ ...form, driverRoleLabel: e.target.value })} />
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.preferredVehicleTypeId} onChange={(e) => setForm({ ...form, preferredVehicleTypeId: e.target.value })}>
              <option value="">نوع وسیله ترجیحی</option>
              {types.map((x) => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </select>
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.assignedVehicleId} onChange={(e) => setForm({ ...form, assignedVehicleId: e.target.value })}>
              <option value="">وسیله تخصیص‌یافته</option>
              {vehicles.map((x) => (
                <option key={x.id} value={x.id}>{x.plateNumber}</option>
              ))}
            </select>
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="شماره گواهینامه" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} disabled={!editId && !form.userId} className="rounded-xl bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50">{t.save}</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">{t.cancel}</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-start">نام</th>
              <th className="px-4 py-3 text-start">موبایل</th>
              <th className="px-4 py-3 text-start">نقش</th>
              <th className="px-4 py-3 text-start">وسیله</th>
              <th className="px-4 py-3 text-start">کد پرسنلی</th>
              <th className="px-4 py-3 text-start">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
            ) : (
              items.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{d.user?.fullName || '—'}</td>
                  <td className="px-4 py-3 dir-ltr text-left">{d.user?.phone || '—'}</td>
                  <td className="px-4 py-3">{d.driverRoleLabel || '—'}</td>
                  <td className="px-4 py-3">{d.assignedVehicle?.plateNumber || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{d.personnelCode || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(d)} className="rounded-lg border px-2 py-1 text-xs">ویرایش</button>
                    {d.assignedVehicle && (
                      <button onClick={async () => {
                        if (!confirm('پس گرفتن وسیله؟')) return;
                        try { await driversApi.revokeVehicle(d.id); load(); } catch (e: any) { alert(e?.response?.data?.message || 'Error'); }
                      }} className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700">پس‌گرفتن وسیله</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
