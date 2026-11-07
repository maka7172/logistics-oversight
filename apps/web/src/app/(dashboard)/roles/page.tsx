'use client';

import { useEffect, useState } from 'react';
import { rbacApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { Plus } from 'lucide-react';

type Perm = { id: string; code: string; module: string; action: string; description?: string };
type Role = {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  isSystem: boolean;
  permissions: Perm[];
};

export default function RolesPage() {
  const locale = useAuthStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const t = messages[locale] as any;
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Perm[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', nameEn: '', permissionCodes: [] as string[] });
  const [error, setError] = useState('');

  const allowed = user?.isSuperAdmin || (user?.permissions || []).includes('*') || (user?.permissions || []).includes('users:manage_roles');

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([rbacApi.roles(), rbacApi.permissions()]);
      setRoles(Array.isArray(r.data) ? r.data : []);
      setPerms(Array.isArray(p.data) ? p.data : []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) load();
    else setLoading(false);
  }, [allowed]);

  const toggle = (code: string) => {
    setForm((f) => ({
      ...f,
      permissionCodes: f.permissionCodes.includes(code)
        ? f.permissionCodes.filter((c) => c !== code)
        : [...f.permissionCodes, code],
    }));
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ code: '', name: '', nameEn: '', permissionCodes: [] });
    setShow(true);
    setError('');
  };

  const openEdit = (role: Role) => {
    setEditId(role.id);
    setForm({
      code: role.code,
      name: role.name,
      nameEn: role.nameEn || '',
      permissionCodes: (role.permissions || []).map((p) => p.code),
    });
    setShow(true);
    setError('');
  };

  const submit = async () => {
    setError('');
    try {
      if (editId) {
        await rbacApi.updateRole(editId, {
          name: form.name,
          nameEn: form.nameEn || undefined,
          permissionCodes: form.permissionCodes,
        });
      } else {
        await rbacApi.createRole({
          code: form.code,
          name: form.name,
          nameEn: form.nameEn || undefined,
          permissionCodes: form.permissionCodes,
        });
      }
      setShow(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error');
    }
  };

  const remove = async (role: Role) => {
    if (role.isSystem) return alert('نقش سیستمی قابل حذف نیست');
    if (!confirm('حذف نقش؟')) return;
    try {
      await rbacApi.removeRole(role.id);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error');
    }
  };

  if (!allowed) {
    return <div className="rounded-2xl border bg-white p-12 text-center text-slate-500">فقط سوپر ادمین</div>;
  }

  const byModule = perms.reduce<Record<string, Perm[]>>((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.roles || 'نقش‌ها و دسترسی'}</h1>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm text-white">
          <Plus size={16} /> نقش جدید
        </button>
      </div>

      {show && (
        <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="کد (english)" disabled={!!editId} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="نام فارسی" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="English name" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">دسترسی‌ها (بخش‌های پنل و API)</div>
            <div className="max-h-64 overflow-y-auto space-y-3 rounded-xl border p-3">
              {Object.entries(byModule).map(([mod, list]) => (
                <div key={mod}>
                  <div className="text-xs font-semibold text-slate-500 mb-1">{mod}</div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((p) => (
                      <label key={p.code} className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] ${form.permissionCodes.includes(p.code) ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200'}`}>
                        <input type="checkbox" className="ml-1" checked={form.permissionCodes.includes(p.code)} onChange={() => toggle(p.code)} />
                        {p.code}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
              <th className="px-4 py-3 text-start">تعداد دسترسی</th>
              <th className="px-4 py-3 text-start">سیستمی</th>
              <th className="px-4 py-3 text-start">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{t.loading}</td></tr>
            ) : roles.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3">{r.permissions?.length || 0}</td>
                <td className="px-4 py-3">{r.isSystem ? 'بله' : 'خیر'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="rounded-lg border px-2 py-1 text-xs">ویرایش دسترسی</button>
                    {!r.isSystem && (
                      <button onClick={() => remove(r)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600">حذف</button>
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
