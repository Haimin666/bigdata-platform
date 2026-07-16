'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { fetchProjects } from '@/features/projects/api';
import { OrchestratorList } from '@/features/orchestrator/OrchestratorList';
import { getCurrentWorkspaceId } from '@/features/workspace/useWorkspace';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Folder, Layers, Users, GitBranch } from 'lucide-react';

export function ProjectDetailContent({ projectId }: { projectId: number }) {
  const t = useTranslations('project');
  const to = useTranslations('orchestrator');
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    setWorkspaceId(getCurrentWorkspaceId() ?? 1);
  }, []);

  const { data: projects } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => fetchProjects(workspaceId as number),
    enabled: workspaceId !== null,
  });

  const project = projects?.find((p) => p.id === projectId);

  const meta = [
    { label: 'id', value: String(project?.id ?? projectId) },
    { label: 'area', value: project?.applicationArea ?? '—' },
    { label: 'product', value: project?.product ?? 'DSS' },
    { label: 'business', value: project?.business ?? '—' },
    { label: 'visibility', value: project?.visibility ?? '—' },
    { label: 'owner', value: project?.createBy ?? '—' },
    { label: 'created', value: project?.createTime ?? '—' },
  ];

  const stats = [
    { icon: Layers, label: to('title'), value: project?.orchestratorCount ?? 0 },
    { icon: GitBranch, label: 'version', value: 'v1' },
    { icon: Users, label: 'members', value: 3 },
  ];

  return (
    <div className="space-y-8">
      <Link
        href="/projects"
        className="mono inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft size={13} /> {t('back')}
      </Link>

      <section className="reveal">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[calc(var(--radius)+4px)] bg-[var(--surface-2)] text-[var(--primary)]">
            <Folder size={22} />
          </span>
          <div className="min-w-0">
            <p className="mono-label">// project</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {project?.name ?? `project #${projectId}`}
            </h1>
            <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
              {project?.description || '—'}
            </p>
          </div>
        </div>

        <div className="mono mt-5 flex flex-wrap gap-2 text-[11px]">
          {meta.map((m) => (
            <span
              key={m.label}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted-foreground)]"
            >
              {m.label}: <span className="amber-text">{m.value}</span>
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <Icon size={18} className="text-[var(--primary)]" />
              <div>
                <p className="mono text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  {label}
                </p>
                <p className="mono text-lg text-[var(--foreground)]">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="mono-label">// orchestrators</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">{to('title')}</h2>
          </div>
        </div>
        <OrchestratorList projectId={projectId} />
      </section>
    </div>
  );
}
