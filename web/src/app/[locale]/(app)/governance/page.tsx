'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/shell/AppShell';
import { fetchDataAssets } from '@/features/data/api';
import { Loader2 } from 'lucide-react';

function fmtNum(n?: number): string {
  if (n == null) return '—';
  if (n >= 1e8) return (n / 1e8).toFixed(2) + ' 亿';
  if (n >= 1e4) return (n / 1e4).toFixed(1) + ' 万';
  return n.toLocaleString();
}

export default function GovernancePage() {
  const t = useTranslations('governance');
  const { data, isLoading } = useQuery({ queryKey: ['assets'], queryFn: fetchDataAssets });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="mono-label">// data governance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('subtitle')}</p>
        </div>

        <div className="overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="mono border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-normal">{t('name')}</th>
                <th className="px-4 py-3 font-normal">{t('type')}</th>
                <th className="px-4 py-3 font-normal">{t('database')}</th>
                <th className="px-4 py-3 font-normal">{t('comment')}</th>
                <th className="px-4 py-3 font-normal">{t('rows')}</th>
                <th className="px-4 py-3 font-normal">{t('size')}</th>
                <th className="px-4 py-3 font-normal">{t('owner')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="mono px-4 py-8 text-center text-[var(--muted-foreground)]">
                    <Loader2 size={14} className="mr-2 inline animate-spin" /> loading…
                  </td>
                </tr>
              ) : (
                data?.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-2)]/60">
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="mono px-4 py-3 text-xs">
                      <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]">{a.type}</span>
                    </td>
                    <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.database}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.comment ?? '—'}</td>
                    <td className="mono px-4 py-3 text-xs text-[var(--foreground)]">{fmtNum(a.rowCount)}</td>
                    <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.sizeMb ? a.sizeMb + ' MB' : '—'}</td>
                    <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.owner ?? '—'}</td>
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
