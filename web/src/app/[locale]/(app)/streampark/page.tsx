'use client';

import { useTranslations } from 'next-intl';
import { AppShell } from '@/components/shell/AppShell';
import { StreamParkOverview } from '@/features/streampark/StreamParkOverview';

export default function StreamParkPage() {
  const t = useTranslations('streampark');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="mono-label">// realtime · streampark</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('subtitle')}</p>
        </div>
        <StreamParkOverview />
      </div>
    </AppShell>
  );
}
