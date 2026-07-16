'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { Button } from '@/components/ui/button';
import type { ScriptItem } from '@/lib/types';
import { Play, Save, Loader2 } from 'lucide-react';

function useIsDark(): boolean {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.dataset.theme !== 'light');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function ScriptEditor({
  script,
  onChange,
  onRun,
  onSave,
  saving,
  running,
}: {
  script: ScriptItem | null;
  onChange: (content: string) => void;
  onRun: () => void;
  onSave: () => void;
  saving: boolean;
  running: boolean;
}) {
  const t = useTranslations('scriptis');
  const isDark = useIsDark();
  const isSql = script?.type.endsWith('.sql');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <div className="mono flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="amber-text">●</span>
          {script?.name ?? t('untitled')}
          {script && (
            <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[9px] uppercase">
              {script.type}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSave} disabled={!script || saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {t('save')}
          </Button>
          <Button size="sm" onClick={onRun} disabled={!script || running}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {t('run')}
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {script ? (
          <CodeMirror
            value={script.content ?? ''}
            theme={isDark ? 'dark' : 'light'}
            height="100%"
            className="h-full text-sm"
            extensions={isSql ? [sql()] : []}
            onChange={onChange}
          />
        ) : (
          <div className="grid h-full place-items-center">
            <p className="mono text-sm text-[var(--muted-foreground)]">{t('selectPrompt')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
