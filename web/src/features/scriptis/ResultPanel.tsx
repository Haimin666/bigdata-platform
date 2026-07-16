'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { RunResult } from '@/lib/types';
import { CheckCircle2, XCircle, Terminal, Table2, Clock } from 'lucide-react';

export function ResultPanel({ result, running }: { result: RunResult | null; running: boolean }) {
  const t = useTranslations('scriptis');
  const [tab, setTab] = useState<'result' | 'log'>('result');

  if (running) {
    return (
      <div className="mono flex items-center gap-2 p-4 text-sm text-[var(--muted-foreground)]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
        </span>
        {t('running')}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mono p-4 text-sm text-[var(--muted-foreground)]">{t('noResult')}</div>
    );
  }

  const ok = result.status === 'success';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <div className="mono flex items-center gap-3 text-xs">
          {ok ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <XCircle size={14} className="text-red-400" />
          )}
          <span className="text-[var(--muted-foreground)]">{result.taskId}</span>
          <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
            <Clock size={11} /> {result.durationMs}ms
          </span>
        </div>
        <div className="mono flex gap-1 text-[11px]">
          <button
            onClick={() => setTab('result')}
            className={`inline-flex items-center gap-1 rounded-[var(--radius)] px-2 py-1 ${
              tab === 'result' ? 'bg-[var(--surface-2)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <Table2 size={12} /> {t('result')}
          </button>
          <button
            onClick={() => setTab('log')}
            className={`inline-flex items-center gap-1 rounded-[var(--radius)] px-2 py-1 ${
              tab === 'log' ? 'bg-[var(--surface-2)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <Terminal size={12} /> {t('log')}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'result' ? (
          result.rows.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--card)]">
                <tr className="mono border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  {result.columns.map((c) => (
                    <th key={c.name} className="px-4 py-2 font-normal">
                      {c.name}
                      {c.type && <span className="ml-1 text-[var(--muted-foreground)]/60">{c.type}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/40 hover:bg-[var(--surface-2)]/60">
                    {row.map((cell, j) => (
                      <td key={j} className="mono px-4 py-2 text-xs text-[var(--foreground)]">
                        {String(cell ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mono p-4 text-sm text-[var(--muted-foreground)]">{t('noData')}</p>
          )
        ) : (
          <pre className="mono overflow-auto p-4 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {result.log.join('\n')}
          </pre>
        )}
      </div>
    </div>
  );
}
