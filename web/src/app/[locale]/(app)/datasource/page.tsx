'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { fetchDataSources } from '@/features/data/api';
import { Loader2 } from 'lucide-react';

export default function DataSourcePage() {
  const t = useTranslations('datasource');
  const { data, isLoading } = useQuery({ queryKey: ['datasources'], queryFn: fetchDataSources });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="mono-label">// datasource</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('subtitle')}</p>
        </div>

        <div className="overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="mono border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-normal">{t('name')}</th>
                <th className="px-4 py-3 font-normal">{t('type')}</th>
                <th className="px-4 py-3 font-normal">{t('host')}</th>
                <th className="px-4 py-3 font-normal">{t('database')}</th>
                <th className="px-4 py-3 font-normal">{t('status')}</th>
                <th className="px-4 py-3 font-normal">{t('owner')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="mono px-4 py-8 text-center text-[var(--muted-foreground)]">
                    <Loader2 size={14} className="mr-2 inline animate-spin" /> loading…
                  </td>
                </tr>
              ) : (
                data?.map((ds) => (
                  <tr key={ds.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-2)]/60">
                    <td className="px-4 py-3 font-medium">{ds.name}</td>
                    <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{ds.type}</td>
                    <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{ds.host}:{ds.port}</td>
                    <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{ds.database ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="mono inline-flex items-center gap-1.5 text-[11px]">
                        <span className={`h-1.5 w-1.5 rounded-full ${ds.status === 'connected' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        {ds.status === 'connected' ? t('connected') : t('offline')}
                      </span>
                    </td>
                    <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{ds.createBy ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
