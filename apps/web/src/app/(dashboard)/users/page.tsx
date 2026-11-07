'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type Role = { id: string; code: string; name: string };
type UserRow = {
  id: string;
  phone: string;
  fullName: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  roles?: Role[];
};

export default function UsersPage() {
  const locale = useAuthStore((s) => s.locale);
  const t = messages[locale];
  const [items, setItems] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: '',
    fullName: '',
    roleCodes: [] as string[],
    isSuperAdmin: false,
  });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([usersApi.list(true), usersApi.roles()]);
      setItems(Array.isArray(u.data) ? u.data : []);
      setRoles(Array.isArray(r.data) ? r.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = (code: string) => {
    setForm((f) => ({
      ...f,
      roleCodes: f.roleCodes.includes(code)
        ? f.roleCodes.filter((c) => c !== code)
        : [...f.roleCodes, code],
    }));
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ phone: '', fullName: '', roleCodes: [], isSuperAdmin: false });
    setShowForm(true);
    setError('');
  };

  const openEdit = (u: UserRow) => {
    setEditId(u.id);
    setForm({
      phone: u.phone,
      fullName: u.fullName,
      roleCodes: (u.roles || []).map((r) => r.code),
      isSuperAdmin: u.isSuperAdmin,
    });
    setShowForm(true);
    setError('');
  };

  const submit = async () => {
    setError('');
    try {
      if (editId) {
        await usersApi.update(editId, {
          fullName: form.fullName,
          roleCodes: form.roleCodes,
          isSuperAdmin: form.isSuperAdmin,
        });
      } else {
        await usersApi.create({
          phone: form.phone,
          fullName: form.fullName,
          roleCodes: form.roleCodes,
          isSuperAdmin: form.isSuperAdmin,
        });
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm('غیرفعال کردن کاربر؟')) return;
    try {
      await usersApi.update(id, { isActive: false });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.users}</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm text-white">
          <Plus size={16} /> {t.add}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              dir="ltr"
              placeholder="موبایل *"
              disabled={!!editId}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="نام کامل *"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-700">نقش‌ها</div>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <label key={r.code} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${form.roleCodes.includes(r.code) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200'}`}>
                  <input type="checkbox" className="mr-1" checked={form.roleCodes.includes(r.code)} onChange={() => toggleRole(r.code)} />
                  {r.name} ({r.code})
                </label>
              ))}
            </div>
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
              <th className="px-4 py-3 text-start">نام</th>
              <th className="px-4 py-3 text-start">موبایل</th>
              <th className="px-4 py-3 text-start">نقش‌ها</th>
              <th className="px-4 py-3 text-start">وضعیت</th>
              <th className="px-4 py-3 text-start">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.noData}</td></tr>
            ) : items.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                <td className="px-4 py-3 dir-ltr text-left">{u.phone}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(u.roles || []).map((r) => (
                      <span key={r.code} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{r.name}</span>
                    ))}
                    {u.isSuperAdmin && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] text-brand-800">Super</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {u.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="rounded-lg border px-2 py-1 text-xs">ویرایش</button>
                    {u.isActive && !u.isSuperAdmin && (
                      <button onClick={() => deactivate(u.id)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600">غیرفعال</button>
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
