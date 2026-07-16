'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AppShell } from '@/components/shell/AppShell';
import { Card } from '@/components/ui/card';
import { ScriptTree } from '@/features/scriptis/ScriptTree';
import { ScriptEditor } from '@/features/scriptis/ScriptEditor';
import { ResultPanel } from '@/features/scriptis/ResultPanel';
import { openScript, runScript, saveScript } from '@/features/scriptis/api';
import type { RunResult, ScriptItem } from '@/lib/types';

export default function ScriptisPage() {
  const t = useTranslations('scriptis');
  const [script, setScript] = useState<ScriptItem | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (name: string) => {
    const s = await openScript(name);
    if (s) {
      setScript(s);
      setResult(null);
    }
  };

  const handleNew = () => {
    setScript({
      id: crypto.randomUUID(),
      name: `untitled_${Math.floor(Math.random() * 1000)}.sql`,
      type: 'spark.sql',
      content: '-- new script\nSELECT 1;\n',
    });
    setResult(null);
  };

  const handleRun = async () => {
    if (!script) return;
    setRunning(true);
    try {
      const r = await runScript(script);
      setResult(r);
      toast.success(t('runSuccess'));
    } catch {
      toast.error(t('runFailed'));
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!script) return;
    setSaving(true);
    try {
      await saveScript(script);
      toast.success(t('saveSuccess'));
    } catch {
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <p className="mono-label">// scriptis ide</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t('subtitle')}</p>
        </div>

        <Card className="grid h-[calc(100vh-220px)] grid-cols-[220px_1fr] overflow-hidden">
          <div className="border-r border-[var(--border)]">
            <ScriptTree selectedId={script?.id} onSelect={handleSelect} onNew={handleNew} />
          </div>
          <div className="grid min-w-0 grid-rows-[1fr_280px]">
            <div className="min-h-0 border-b border-[var(--border)]">
              <ScriptEditor
                script={script}
                onChange={(c) => setScript((s) => (s ? { ...s, content: c } : s))}
                onRun={handleRun}
                onSave={handleSave}
                saving={saving}
                running={running}
              />
            </div>
            <div className="min-h-0">
              <ResultPanel result={result} running={running} />
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
