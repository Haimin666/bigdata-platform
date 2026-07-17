'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Radio, Boxes, Cpu, MemoryStick, Activity, FolderGit2, AppWindow } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import {
  getSpApps,
  getSpDashboard,
  getSpEnvs,
  getSpProjects,
  type SpApp,
  type SpDashboard,
  type SpEnv,
  type SpProject,
  type PageResult,
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
  const [apps, setApps] = useState<PageResult<SpApp> | null>(null);
  const [appsLoading, setAppsLoading] = useState(false);

  const fetchApps = async (page: number) => {
    setAppsLoading(true);
    try {
      const res = await getSpApps(page, 20);
      setApps(res);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([getSpDashboard(), getSpProjects(), getSpEnvs()])
      .then(([d, p, e]) => { setDash(d); setProjects(p?.records ?? []); setEnvs(e?.records ?? []); fetchApps(1); })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* Flink 应用列表（分页，只读） */}
      <div className="rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--card)]/60">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
          <AppWindow size={14} className="amber-text" />
          <p className="mono-label">// {t('apps')}</p>
          <span className="mono ml-auto text-[10px] text-[var(--muted-foreground)]">{apps?.total ?? 0}</span>
        </div>
        <div className="overflow-auto">
          {appsLoading ? (
            <div className="px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">
              <Loader2 size={13} className="mr-1.5 inline animate-spin" /> {t('loading')}
            </div>
          ) : (apps?.records ?? []).length === 0 ? (
            <p className="mono px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">{t('noApps')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="mono border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  <th className="px-4 py-3 font-normal">{t('appName')}</th>
                  <th className="px-4 py-3 font-normal">{t('appState')}</th>
                  <th className="px-4 py-3 font-normal">{t('appMode')}</th>
                  <th className="px-4 py-3 font-normal">{t('appFlink')}</th>
                  <th className="px-4 py-3 font-normal">TM</th>
                  <th className="px-4 py-3 font-normal">Slot</th>
                  <th className="px-4 py-3 font-normal">{t('appStartTime')}</th>
                </tr>
              </thead>
              <tbody>
                {(apps?.records ?? []).map((a) => {
                  const st = Number(a.state);
                  const stText = ({ 0: '新增', 1: '已启动', 3: '已发布', 4: '运行中', 5: '失败', 7: '已停止', 9: '映射中' } as Record<number, string>)[st] ?? String(a.state ?? '');
                  const stColor = st === 4 ? 'text-emerald-400' : st === 5 ? 'text-red-400' : 'text-[var(--muted-foreground)]';
                  return (
                    <tr key={a.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-2)]/60">
                      <td className="mono px-4 py-3 text-xs font-medium text-[var(--foreground)]">{a.jobName ?? a.id}</td>
                      <td className={`mono px-4 py-3 text-xs ${stColor}`}>{stText}</td>
                      <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.executionMode ?? '—'}</td>
                      <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.flinkVersion ?? '—'}</td>
                      <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.totalTM ?? '—'}</td>
                      <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.availableSlot ?? 0}/{a.totalSlot ?? 0}</td>
                      <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.startTime ? String(a.startTime).replace('T', ' ').slice(0, 19) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={apps} onPage={fetchApps} className="border-t border-[var(--border)]" />
      </div>

      <p className="mono text-center text-[10px] text-[var(--muted-foreground)]/60">{t('readOnly')}</p>
    </div>
  );
}
