'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { fetchScripts } from './api';
import type { ScriptType } from '@/lib/types';
import { FileCode2, FileTerminal, FileText, Braces, FilePlus2, Loader2 } from 'lucide-react';

const TYPE_ICON: Record<ScriptType, typeof FileCode2> = {
  'spark.sql': FileCode2,
  'hive.sql': FileCode2,
  python: Braces,
  shell: FileTerminal,
  scala: FileText,
};

const TYPE_BADGE: Record<ScriptType, string> = {
  'spark.sql': 'spark',
  'hive.sql': 'hive',
  python: 'py',
  shell: 'sh',
  scala: 'scala',
};

export function ScriptTree({
  selectedId,
  onSelect,
  onNew,
}: {
  selectedId?: string;
  onSelect: (name: string) => void;
  onNew: () => void;
}) {
  const t = useTranslations('scriptis');
  const { data, isLoading } = useQuery({ queryKey: ['scripts'], queryFn: fetchScripts });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
        <p className="mono-label">// scripts</p>
        <button
          onClick={onNew}
          className="mono inline-flex items-center gap-1 rounded-[var(--radius)] px-2 py-1 text-[11px] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--primary)]"
        >
          <FilePlus2 size={12} /> {t('new')}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {isLoading ? (
          <p className="mono flex items-center gap-2 p-2 text-xs text-[var(--muted-foreground)]">
            <Loader2 size={12} className="animate-spin" /> loading…
          </p>
        ) : (
          <ul className="space-y-0.5">
            {data?.map((s) => {
              const Icon = TYPE_ICON[s.type] ?? FileCode2;
              const active = s.id === selectedId;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => onSelect(s.name)}
                    className={`group flex w-full items-center gap-2 rounded-[var(--radius)] px-2.5 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-2)]/60 hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Icon size={14} className={active ? 'amber-text' : ''} />
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="mono rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[9px] uppercase text-[var(--muted-foreground)]">
                      {TYPE_BADGE[s.type]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
