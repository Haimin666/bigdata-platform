'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Radio, Boxes, Cpu, MemoryStick, Activity, FolderGit2 } from 'lucide-react';
import {
  getSpDashboard,
  getSpEnvs,
  getSpProjects,
  type SpDashboard,
  type SpEnv,
  type SpProject,
} from '@/lib/platform';

function fmtMem(mb: number): string {
  if (!mb) return '—';
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
  return mb + ' MB';
}

const TASK_STATES: { key: keyof SpDashboard['task']; tone: string }[] = [
  { key: 'running', tone: 'text-emerald-400' },
  { key: 'failed', tone: 'text-red-400' },
  { key: 'canceled', tone: 'text-[var(--muted-foreground)]' },
  { key: 'finished', tone: 'text-sky-400' },
  { key: 'scheduled', tone: 'text-amber-400' },
  { key: 'deploying', tone: 'text-[var(--primary)]' },
];

function MetricCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Radio; label: string; value: string | number; sub?: string; tone?: string;
}) {
  return (
    <div className="rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--card)]/60 p-4">
      <div className="flex items-center justify-between">
        <p className="mono-label">// {label}</p>
        <Icon size={15} className={tone ?? 'text-[var(--muted-foreground)]'} />
      </div>
      <p className={`mono mt-2 text-2xl font-bold ${tone ?? 'text-[var(--foreground)]'}`}>{value}</p>
      {sub && <p className="mono mt-0.5 text-[10px] text-[var(--muted-foreground)]">{sub}</p>}
    </div>
  );
}

export function StreamParkOverview() {
  const t = useTranslations('streampark');
  const [dash, setDash] = useState<SpDashboard | null>(null);
  const [projects, setProjects] = useState<SpProject[]>([]);
  const [envs, setEnvs] = useState<SpEnv[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSpDashboard(), getSpProjects(), getSpEnvs()])
      .then(([d, p, e]) => { setDash(d); setProjects(p ?? []); setEnvs(e ?? []); })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">
        <Loader2 size={18} className="mr-2 animate-spin" /> {t('loading')}
      </div>
    );
  }

  const task = dash?.task;

  return (
    <div className="space-y-6">
      {/* 指标卡 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Radio} label={t('runningJob')} value={dash?.runningJob ?? 0} sub={t('jobsSub')} tone="text-emerald-400" />
        <MetricCard icon={Cpu} label={t('slots')} value={`${dash?.availableSlot ?? 0} / ${dash?.totalSlot ?? 0}`} sub={t('slotsSub')} />
        <MetricCard icon={Boxes} label={t('taskTm')} value={dash?.totalTM ?? 0} sub={t('taskTmSub')} />
        <MetricCard icon={MemoryStick} label={t('memory')} value={fmtMem(dash?.tmMemory ?? 0)} sub={`${t('jm')}: ${fmtMem(dash?.jmMemory ?? 0)}`} />
      </div>

      {/* Task 状态分布 */}
      {task && (
        <div className="rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--card)]/60 p-5">
          <div className="flex items-center gap-2">
            <Activity size={15} className="amber-text" />
            <p className="mono-label">// {t('taskDist')}</p>
            <span className="mono ml-auto text-[10px] text-[var(--muted-foreground)]">{t('totalTasks')}: {task.total}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {TASK_STATES.map(({ key, tone }) => (
              <div key={key} className="rounded-[var(--radius)] border border-[var(--border)]/60 bg-[var(--background)]/50 px-3 py-2.5">
                <p className="mono text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">{t(`task_${key}`)}</p>
                <p className={`mono mt-1 text-lg font-bold ${tone}`}>{task[key]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flink 环境 + 项目 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--card)]/60">
          <div className="border-b border-[var(--border)] px-4 py-2.5">
            <p className="mono-label">// {t('envs')}</p>
          </div>
          <div className="p-3 space-y-1.5">
            {envs.length === 0 ? (
              <p className="mono px-2 py-3 text-center text-xs text-[var(--muted-foreground)]">{t('noEnvs')}</p>
            ) : envs.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--border)]/60 px-3 py-2">
                <span className="mono text-xs font-medium text-[var(--foreground)]">{e.flinkName || `Flink-${e.version}`}</span>
                <span className="mono flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                  <span className="rounded-full border border-[var(--border)] px-1.5 py-0.5">scala {e.scalaVersion}</span>
                  {e.isDefault && <span className="rounded-full border border-emerald-500/40 px-1.5 py-0.5 text-emerald-400">default</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--card)]/60">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <p className="mono-label">// {t('projects')}</p>
            <span className="mono text-[10px] text-[var(--muted-foreground)]">{projects.length}</span>
          </div>
          <div className="max-h-72 space-y-1 overflow-auto p-3">
            {projects.length === 0 ? (
              <p className="mono px-2 py-3 text-center text-xs text-[var(--muted-foreground)]">{t('noProjects')}</p>
            ) : projects.map((p) => (
              <div key={p.id} className="rounded-[var(--radius)] border border-[var(--border)]/60 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <FolderGit2 size={12} className="shrink-0 text-[var(--muted-foreground)]" />
                  <span className="mono truncate text-xs font-medium text-[var(--foreground)]">{p.name}</span>
                </div>
                <div className="mono mt-0.5 truncate text-[10px] text-[var(--muted-foreground)]">{p.branches ? `@ ${p.branches}` : (p.url ?? '')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mono text-center text-[10px] text-[var(--muted-foreground)]/60">{t('readOnly')}</p>
    </div>
  );
}
