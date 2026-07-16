'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchOrchestrators } from './api';
import type { OrchestratorStatus } from '@/lib/types';
import { Workflow, Loader2, ArrowUpRight } from 'lucide-react';

const STATUS_STYLE: Record<OrchestratorStatus, { dot: string; label: string }> = {
  published: { dot: 'bg-emerald-400', label: '已发布' },
  developing: { dot: 'bg-sky-400', label: '开发中' },
  disabled: { dot: 'bg-zinc-500', label: '已停用' },
};

export function OrchestratorList({ projectId }: { projectId: number }) {
  const t = useTranslations('orchestrator');
  const { data, isLoading } = useQuery({
    queryKey: ['orchestrators', projectId],
    queryFn: () => fetchOrchestrators(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <p className="mono flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Loader2 size={14} className="animate-spin" /> loading orchestrators…
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="mono text-sm text-[var(--muted-foreground)]">{t('empty')}</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="mono border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            <th className="px-4 py-3 font-normal">{t('name')}</th>
            <th className="px-4 py-3 font-normal">{t('version')}</th>
            <th className="px-4 py-3 font-normal">{t('status')}</th>
            <th className="px-4 py-3 font-normal">{t('owner')}</th>
            <th className="px-4 py-3 font-normal">{t('createTime')}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.map((o, i) => {
            const st = STATUS_STYLE[o.status ?? 'developing'];
            return (
              <tr
                key={o.orchestratorId}
                className="group border-b border-[var(--border)]/60 transition-colors last:border-0 hover:bg-[var(--surface-2)]"
                style={{ animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Workflow size={15} className="text-[var(--primary)]" />
                    <div>
                      <p className="font-medium leading-tight">{o.orchestratorName}</p>
                      {o.description && (
                        <p className="mono mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                          {o.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  v{o.orchestratorVersionId ?? 1}
                </td>
                <td className="px-4 py-3">
                  <span className="mono inline-flex items-center gap-1.5 text-[11px]">
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </td>
                <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {o.createBy ?? '—'}
                </td>
                <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">
                  {o.createTime ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toast.info(t('canvasTodo'))}
                    className="mono inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] opacity-0 transition-opacity hover:text-[var(--primary)] group-hover:opacity-100"
                  >
                    {t('open')} <ArrowUpRight size={12} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
