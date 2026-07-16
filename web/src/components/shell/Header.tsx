'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from './ThemeToggle';
import { Terminal } from 'lucide-react';

export function Header() {
  const t = useTranslations('common');
  const tw = useTranslations('workspace');
  const pathname = usePathname();
  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/85 backdrop-blur-md">
      <div className="h-px w-full bg-gradient-to-r from-[var(--primary)]/0 via-[var(--primary)]/70 to-[var(--primary)]/0" />
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/workspaceHome" className="group flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-foreground)] transition-transform group-hover:scale-105">
              <Terminal size={17} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">{t('appName')}</span>
              <span className="mono mt-0.5 text-[10px] text-[var(--muted-foreground)]">v1.2.2</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/workspaceHome"
              className={`mono-label rounded-[var(--radius)] px-3 py-2 transition-colors ${
                isActive('/workspaceHome')
                  ? 'text-[var(--primary)]'
                  : 'hover:text-[var(--foreground)]'
              }`}
            >
              {tw('title')}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <WorkspaceSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
