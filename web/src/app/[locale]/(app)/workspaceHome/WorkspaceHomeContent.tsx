'use client';

import { useTranslations } from 'next-intl';
import { useWorkspaces, getCurrentWorkspaceId, setCurrentWorkspaceId } from '@/features/workspace/useWorkspace';
import { ProjectList } from '@/features/projects/ProjectList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Database, Cpu, GitBranch } from 'lucide-react';

export function WorkspaceHomeContent() {
  const t = useTranslations('workspace');
  const { data, isLoading } = useWorkspaces();
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    const stored = getCurrentWorkspaceId();
    if (stored !== null) setWorkspaceId(stored);
    else if (data && data.length > 0) {
      const def = data.find((w) => w.isDefaultWorkspace) ?? data[0];
      setCurrentWorkspaceId(def.id);
      setWorkspaceId(def.id);
    }
  }, [data]);

  const current = data?.find((w) => w.id === workspaceId);

  const stats = [
    { icon: Database, label: 'engines', value: 'spark·flink·sqop' },
    { icon: Cpu, label: 'compute', value: 'linkis 1.x' },
    { icon: GitBranch, label: 'vcs', value: 'git integrated' },
  ];

  return (
    <div className="space-y-10">
      <section className="reveal">
        <p className="mono-label">// workspace overview</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          {current?.name ?? (isLoading ? '…' : t('noWorkspace'))}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">
          {current?.description || t('homeDesc')}
        </p>
        <div className="mono mt-5 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted-foreground)]">
            id: <span className="amber-text">{current?.id ?? '—'}</span>
          </span>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted-foreground)]">
            env: production
          </span>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted-foreground)]">
            tenant: hadoop
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <ProjectList workspaceId={workspaceId as number} />
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles size={15} className="amber-text" />
                <span className="mono-label">{t('appProcess')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="mono space-y-2 text-xs text-[var(--muted-foreground)]">
                {['数据接入', '开发清洗', '编排调度', '发布上线'].map((s, i) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="amber-text">{String(i + 1).padStart(2, '0')}</span>
                    <span className="h-px flex-1 bg-[var(--border)]" />
                    <span className="text-[var(--foreground)]">{s}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen size={15} className="amber-text" />
                <span className="mono-label">{t('knowledge')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center justify-between rounded-[var(--radius)] px-2 py-1.5 hover:bg-[var(--surface-2)]">
                <span>快速入门指南</span><span className="mono">→</span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius)] px-2 py-1.5 hover:bg-[var(--surface-2)]">
                <span>工作流编排手册</span><span className="mono">→</span>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius)] px-2 py-1.5 hover:bg-[var(--surface-2)]">
                <span>最佳实践</span><span className="mono">→</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-3 gap-3 p-4">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="space-y-1">
                  <Icon size={14} className="text-[var(--muted-foreground)]" />
                  <p className="mono text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>
                  <p className="mono text-[10px] text-[var(--foreground)]">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
