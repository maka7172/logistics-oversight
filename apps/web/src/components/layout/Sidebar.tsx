'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Truck, Users, UserCircle,
  CalendarRange, MapPinned, UserCog, LogOut, Languages, BookOpen, ScrollText, Shield, BarChart3, Radio,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { messages } from '@/i18n/messages';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  key: string;
  icon: any;
  perms?: string[];
  superOnly?: boolean;
};

const nav: NavItem[] = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/catalog', key: 'catalog', icon: BookOpen, perms: ['products:read', 'products:write'] },
  { href: '/products', key: 'products', icon: Package, perms: ['products:read'] },
  { href: '/vehicles', key: 'vehicles', icon: Truck, perms: ['vehicles:read'] },
  { href: '/drivers', key: 'drivers', icon: UserCircle, perms: ['drivers:read'] },
  { href: '/customers', key: 'customers', icon: Users, perms: ['customers:read'] },
  { href: '/shifts', key: 'shifts', icon: CalendarRange, perms: ['shifts:read'] },
  { href: '/missions', key: 'missions', icon: MapPinned, perms: ['missions:read'] },
  { href: '/monitor', key: 'monitor', icon: Radio, perms: ['gis:read', 'shifts:read'] },
  { href: '/reports', key: 'reports', icon: BarChart3, perms: ['finance:read', 'shifts:read'] },
  { href: '/users', key: 'users', icon: UserCog, perms: ['users:read', 'users:write'] },
  { href: '/roles', key: 'roles', icon: Shield, perms: ['users:manage_roles'], superOnly: true },
  { href: '/audit', key: 'audit', icon: ScrollText, perms: ['audit:read'], superOnly: true },
];

function canSee(item: NavItem, user: any): boolean {
  if (!user) return false;
  if (user.isSuperAdmin || (user.permissions || []).includes('*')) return true;

  if (item.superOnly) return false;
  if (!item.perms || item.perms.length === 0) return true;
  const up: string[] = user.permissions || [];
  const roleCodes = (user.roles || []).map((r: any) => r.code);
  if (
    roleCodes.includes('driver') &&
    !roleCodes.some((c: string) =>
      ['admin', 'supervisor', 'dispatcher', 'finance', 'super_admin'].includes(c),
    )
  ) {
    return item.href === '/dashboard';
  }
  return item.perms.some((p) => up.includes(p));
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, locale, setLocale } = useAuthStore();
  const t = messages[locale] as any;
  const visible = nav.filter((item) => canSee(item, user));

  return (
    <aside className="fixed inset-y-0 right-0 z-30 flex w-64 flex-col bg-ink text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <img src="/brand/combination.png" alt="ROOK" className="h-10 w-9 rounded-lg object-cover ring-1 ring-white/10" />
        <div>
          <div className="text-sm font-bold tracking-[0.2em]">ROOK</div>
          <div className="text-[11px] text-white/50">Admin Panel</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'text-white/70 hover:bg-white/8 hover:text-white',
              )}
            >
              <Icon size={18} className="shrink-0" />
              {t[item.key] || item.key}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-2">
        <button
          onClick={() => setLocale(locale === 'fa' ? 'en' : 'fa')}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white"
        >
          <Languages size={16} />
          {locale === 'fa' ? 'English' : 'فارسی'}
        </button>
        <div className="rounded-xl bg-white/8 px-3 py-2">
          <div className="text-sm font-medium text-white truncate">{user?.fullName}</div>
          <div className="text-xs text-white/45 dir-ltr text-left">{user?.phone}</div>
        </div>
        <button
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-brand-300 hover:bg-brand-500/15 hover:text-brand-200"
        >
          <LogOut size={16} />
          {t.logout}
        </button>
      </div>
    </aside>
  );
}
