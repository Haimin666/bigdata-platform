'use client';

import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/shell/AppShell';
import { LineageExplorer } from '@/features/lineage/LineageExplorer';

export default function LineagePage() {
  const t = useTranslations('lineage');

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-140px)] flex-col space-y-4">
        <div>
          <p className="mono-label">// data lineage · openmetadata</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('subtitle')}</p>
        </div>
        <div className="min-h-0 flex-1">
          <LineageExplorer />
        </div>
      </div>
    </AppShell>
  );
}
