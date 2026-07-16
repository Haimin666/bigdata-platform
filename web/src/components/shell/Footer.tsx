'use client';

import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('common');
  return (
    <footer className="flex h-10 items-center justify-between border-t border-[var(--border)] px-6 mono text-[11px] text-[var(--muted-foreground)]">
      <span>© {new Date().getFullYear()} {t('appName')} · WeDataSphere</span>
      <span className="hidden sm:inline">build 1.2.2 · region cn-north</span>
    </footer>
  );
}
