'use client';

import { useTranslations } from 'next-intl';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { useWorkspaces, getCurrentWorkspaceId, setCurrentWorkspaceId } from '@/features/workspace/useWorkspace';
import { useEffect, useState } from 'react';
import { ChevronsUpDown, Check, SquareStack } from 'lucide-react';

export function WorkspaceSwitcher() {
  const t = useTranslations('workspace');
  const { data, isLoading } = useWorkspaces();
  const [currentId, setCurrentId] = useState<number | null>(null);

  useEffect(() => {
    if (currentId === null) {
      const stored = getCurrentWorkspaceId();
      if (stored !== null) setCurrentId(stored);
      else if (data && data.length > 0) {
        const def = data.find((w) => w.isDefaultWorkspace) ?? data[0];
        setCurrentWorkspaceId(def.id);
        setCurrentId(def.id);
      }
    }
  }, [data, currentId]);

  const current = data?.find((w) => w.id === currentId);

  return (
    <Dropdown
      align="start"
      trigger={
        <span className="mono group flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]/40 px-3 py-1.5 text-xs hover:border-[var(--primary)]/50">
          <SquareStack size={14} className="amber-text" />
          <span className="text-[var(--muted-foreground)]">ws://</span>
          <span className="max-w-36 overflow-hidden overflow-ellipsis whitespace-nowrap font-medium text-[var(--foreground)]">
            {current?.name ?? (isLoading ? '…' : t('noWorkspace'))}
          </span>
          <ChevronsUpDown size={13} className="text-[var(--muted-foreground)]" />
        </span>
      }
    >
      {(close) => (
        <div className="max-h-80 overflow-auto">
          <p className="mono-label px-3 py-2">{t('switch')}</p>
          {data?.map((w) => (
            <DropdownItem
              key={w.id}
              onClick={() => {
                setCurrentWorkspaceId(w.id);
                setCurrentId(w.id);
                close();
              }}
            >
              <span className="flex-1 text-sm">{w.name}</span>
              {w.isDefaultWorkspace && (
                <span className="mono text-[10px] text-[var(--muted-foreground)]">default</span>
              )}
              {w.id === currentId && <Check size={14} className="amber-text" />}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
