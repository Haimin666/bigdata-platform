'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchProjects } from './api';
import { CreateProjectDialog } from './CreateProjectDialog';
import { FolderPlus, Folder, ArrowUpRight, Layers, Clock } from 'lucide-react';

export function ProjectList({ workspaceId }: { workspaceId: number }) {
  const t = useTranslations('project');
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => fetchProjects(workspaceId),
    enabled: !!workspaceId,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="mono-label">// projects</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {t('list')}
            {data ? (
              <span className="mono ml-2 text-sm text-[var(--muted-foreground)]">
                [{String(data.length).padStart(2, '0')}]
              </span>
            ) : null}
          </h2>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">
          <FolderPlus size={15} /> {t('create')}
        </Button>
      </div>

      {isLoading ? (
        <p className="mono text-sm text-[var(--muted-foreground)]">loading projects…</p>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.map((p, i) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="reveal block"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <Card className="group h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/50 hover:shadow-[0_0_28px_-10px_var(--amber-glow)]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-[var(--radius)] bg-[var(--surface-2)] text-[var(--primary)]">
                        <Folder size={17} />
                      </span>
                      <div>
                        <p className="font-semibold leading-tight">{p.name}</p>
                        <p className="mono mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                          id:{p.id} · {p.createBy ?? 'hadoop'}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                    {p.description || '—'}
                  </p>
                  <div className="mono mt-4 flex flex-wrap items-center gap-2 text-[10px]">
                    {p.applicationArea && (
                      <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]">
                        {p.applicationArea}
                      </span>
                    )}
                    {p.visibility && (
                      <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]">
                        {p.visibility}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]">
                      <Layers size={11} /> {p.orchestratorCount ?? 0}
                    </span>
                    {p.createTime && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[var(--muted-foreground)]">
                        <Clock size={11} /> {p.createTime}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <FolderPlus size={28} className="text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">{t('empty')}</p>
          </CardContent>
        </Card>
      )}

      {open && (
        <CreateProjectDialog workspaceId={workspaceId} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
