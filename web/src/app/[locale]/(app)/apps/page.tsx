'use client';

import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/shell/AppShell';
import { AppConnGrid } from '@/features/apps/AppConnGrid';

export default function AppsPage() {
  const t = useTranslations('apps');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="mono-label">// application hub</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('subtitle')}</p>
        </div>
        <AppConnGrid />
      </div>
    </AppShell>
  );
}
