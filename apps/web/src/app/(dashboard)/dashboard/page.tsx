'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { reportsApi } from '@/lib/api';
import { Package, Truck, UserCircle, CalendarRange, MapPinned, Radio } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, locale } = useAuthStore();
  const t = messages[locale] as any;
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    reportsApi.dashboard().then((r) => setStats(r.data)).catch(() => setStats(null));
  }, []);

  const cards = [
    { href: '/shifts', label: 'شیفت فعال', value: stats?.shiftsActive, icon: CalendarRange, color: 'bg-amber-500' },
    { href: '/missions', label: 'مأموریت باز', value: stats?.missionsOpen, icon: MapPinned, color: 'bg-sky-500' },
    { href: '/drivers', label: 'راننده فعال', value: stats?.driversActive, icon: UserCircle, color: 'bg-violet-500' },
    { href: '/products', label: 'کالای فعال', value: stats?.products ?? stats?.productsActive, icon: Package, color: 'bg-emerald-500' },
    { href: '/monitor', label: 'پایش زنده', value: '●', icon: Radio, color: 'bg-rose-500' },
    { href: '/reports', label: 'گزارشات', value: stats?.missionsDone ?? '—', icon: Truck, color: 'bg-slate-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.welcome}، {user?.fullName}</h1>
        <p className="mt-1 text-slate-500 text-sm">{user?.roles?.map((r: any) => r.name).join(' · ') || 'Admin'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href + c.label} href={c.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-brand-200">
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.color} text-white`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{c.value ?? '—'}</div>
              <div className="text-sm text-slate-500 group-hover:text-brand-800">{c.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
