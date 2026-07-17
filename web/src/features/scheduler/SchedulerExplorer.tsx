'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Play, Power, PowerOff, History, Workflow as WorkflowIcon } from 'lucide-react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Pagination } from '@/components/ui/pagination';
import {
  getDsInstances,
  getDsProjects,
  getDsWorkflow,
  getDsWorkflows,
  releaseDsWorkflow,
  triggerDsWorkflow,
  type DsProject,
  type DsWorkflow,
  type PageResult,
} from '@/lib/platform';

/* DS 2.x processDefinitionJson 里的任务 */
interface DsTask {
  id: string | number;
  name: string;
  type: string;
  preTasks?: string[];
  runFlag?: string;
}
interface DsDag {
  tasks?: DsTask[];
  connects?: { startId?: string | number; endId?: string | number }[];
}

interface DsNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  disabled: boolean;
}

const TASK_COLORS: Record<string, string> = {
  SQL: '#60a5fa',
  SHELL: '#34d399',
  PYTHON: '#fbbf24',
  SUB_PROCESS: '#f472b6',
  DEPENDENT: '#a78bfa',
};

/** DS processDefinitionJson 字符串 → {nodes, edges}，按 preTasks 分层布局。 */
function parseDag(json: string | undefined): { nodes: Node<DsNodeData>[]; edges: Edge[] } {
  if (!json) return { nodes: [], edges: [] };
  let def: DsDag = {};
  try {
    def = JSON.parse(json) as DsDag;
  } catch {
    return { nodes: [], edges: [] };
  }
  const tasks = def.tasks ?? [];
  const byName = new Map(tasks.map((t) => [t.name, t]));

  // BFS 定层（按 preTasks）
  const dist = new Map<string, number>();
  const resolve = (t: DsTask): number => {
    if (dist.has(t.name)) return dist.get(t.name)!;
    const pres = (t.preTasks ?? []).filter((p) => byName.has(p));
    const d = pres.length === 0 ? 0 : Math.max(...pres.map((p) => resolve(byName.get(p)!))) + 1;
    dist.set(t.name, d);
    return d;
  };
  for (const t of tasks) resolve(t);

  const byLayer = new Map<number, DsTask[]>();
  for (const t of tasks) {
    const d = dist.get(t.name) ?? 0;
    (byLayer.get(d) ?? byLayer.set(d, []).get(d)!).push(t);
  }

  const COL = 220;
  const ROW = 80;
  const nodes: Node<DsNodeData>[] = [];
  for (const [layer, ts] of byLayer) {
    ts.forEach((t, i) => {
      nodes.push({
        id: String(t.id),
        position: { x: layer * COL, y: (i - (ts.length - 1) / 2) * ROW },
        data: { label: t.name, type: t.type, disabled: t.runFlag === 'FORBIDDEN' },
      });
    });
  }

  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (const t of tasks) {
    for (const pre of t.preTasks ?? []) {
      const p = byName.get(pre);
      if (p && !seen.has(`${p.id}->${t.id}`)) {
        seen.add(`${p.id}->${t.id}`);
        edges.push({ id: `e-${p.id}-${t.id}`, source: String(p.id), target: String(t.id), animated: true });
      }
    }
  }
  for (const c of def.connects ?? []) {
    if (c.startId && c.endId && !seen.has(`${c.startId}->${c.endId}`)) {
      seen.add(`${c.startId}->${c.endId}`);
      edges.push({ id: `ec-${c.startId}-${c.endId}`, source: String(c.startId), target: String(c.endId), animated: true });
    }
  }
  return { nodes, edges };
}

function DagNode({ data }: { data: DsNodeData }) {
  const color = TASK_COLORS[data.type] ?? 'var(--muted-foreground)';
  return (
    <div
      className={`mono min-w-[140px] rounded-[var(--radius)] border px-3 py-2 text-xs ${
        data.disabled ? 'border-[var(--border)]/40 opacity-50' : 'border-[var(--border)] bg-[var(--card)]'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate font-medium text-[var(--foreground)]">{data.label}</span>
      </div>
      <div className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">{data.type}</div>
    </div>
  );
}
const nodeTypes = { ds: DagNode };

function isOnline(wf: DsWorkflow): boolean {
  return wf.releaseState === 'ONLINE' || String(wf.releaseState) === '1';
}

export function SchedulerExplorer() {
  const t = useTranslations('scheduler');
  const [projects, setProjects] = useState<DsProject[]>([]);
  const [projectName, setProjectName] = useState('');
  const [workflows, setWorkflows] = useState<DsWorkflow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<DsWorkflow | null>(null);
  const [loadingDag, setLoadingDag] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [instances, setInstances] = useState<PageResult<Record<string, unknown>> | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    getDsProjects().then((ps) => {
      setProjects(ps?.records ?? []);
      if (ps?.records?.length) setProjectName(ps.records[0].name);
    }).catch((e) => toast.error((e as Error).message));
  }, []);

  useEffect(() => {
    if (!projectName) return;
    setLoadingList(true);
    setSelected(null);
    getDsWorkflows(projectName).then((ws) => setWorkflows(ws?.records ?? [])).catch((e) => toast.error((e as Error).message)).finally(() => setLoadingList(false));
  }, [projectName]);

  const openDag = useCallback(async (wf: DsWorkflow) => {
    setSelected(wf);
    setLoadingDag(true);
    try {
      const detail = await getDsWorkflow(projectName, wf.id);
      setSelected(detail);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingDag(false);
    }
  }, [projectName]);

  const onTrigger = useCallback(async (wf: DsWorkflow) => {
    setBusy(wf.id);
    try {
      await triggerDsWorkflow(projectName, wf.id);
      toast.success(t('triggered', { name: wf.name }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [projectName, t]);

  const onToggleRelease = useCallback(async (wf: DsWorkflow) => {
    setBusy(wf.id);
    const online = !isOnline(wf);
    try {
      await releaseDsWorkflow(projectName, wf.id, online);
      toast.success(online ? t('onlined') : t('offlined'));
      setWorkflows((ws) => ws.map((w) => (w.id === wf.id ? { ...w, releaseState: online ? 'ONLINE' : 'OFFLINE' } : w)));
      if (selected?.id === wf.id) setSelected((s) => (s ? { ...s, releaseState: online ? 'ONLINE' : 'OFFLINE' } : s));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [projectName, selected, t]);

  const fetchHistory = useCallback(async (page: number) => {
    setLoadingHistory(true);
    try {
      const res = await getDsInstances(projectName, page, 20);
      setInstances(res);
      setHistoryPage(res.page || page);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingHistory(false);
    }
  }, [projectName]);

  const loadHistory = useCallback(() => {
    setShowHistory((v) => {
      const next = !v;
      if (next) fetchHistory(1);
      return next;
    });
  }, [fetchHistory]);

  const dag = useMemo(() => parseDag(selected?.processDefinitionJson), [selected]);

  return (
    <div className="flex h-full flex-col space-y-3">
      {/* 顶部：项目选择 + 历史 */}
      <div className="flex items-center gap-3">
        <select
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="mono rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]/60"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
        <span className="mono text-[10px] text-[var(--muted-foreground)]">{workflows.length} {t('workflows')}</span>
        <button
          onClick={loadHistory}
          className={`mono flex items-center gap-1.5 rounded-[var(--radius)] border px-2.5 py-1.5 text-xs transition-colors ${
            showHistory ? 'border-[var(--primary)]/60 bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          <History size={13} /> {t('history')}
        </button>
      </div>

      {showHistory ? (
        <InstancesView data={instances} loading={loadingHistory} t={t} onPage={fetchHistory} />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border)]">
          {/* 工作流列表 */}
          <div className="flex flex-col border-r border-[var(--border)] bg-[var(--card)]/60">
            <div className="border-b border-[var(--border)] px-3 py-2.5">
              <p className="mono-label">// workflows</p>
            </div>
            <div className="flex-1 space-y-1 overflow-auto p-2">
              {loadingList && (
                <div className="px-2 py-4 text-center text-xs text-[var(--muted-foreground)]">
                  <Loader2 size={13} className="mr-1.5 inline animate-spin" /> {t('loading')}
                </div>
              )}
              {workflows.map((wf) => {
                const online = isOnline(wf);
                const isSel = selected?.id === wf.id;
                return (
                  <div
                    key={wf.id}
                    onClick={() => openDag(wf)}
                    className={`group cursor-pointer rounded-[var(--radius)] border px-2.5 py-2 transition-colors ${
                      isSel ? 'border-[var(--primary)]/60 bg-[var(--primary)]/10' : 'border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-2)]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-[var(--foreground)]">{wf.name}</span>
                      <span className={`mono shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] ${online ? 'border-emerald-500/40 text-emerald-400' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}>
                        {online ? 'online' : 'offline'}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onTrigger(wf)}
                        disabled={busy === wf.id}
                        title={t('trigger')}
                        className="mono flex items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] px-1.5 py-1 text-[10px] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)] disabled:opacity-50"
                      >
                        {busy === wf.id ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                      </button>
                      <button
                        onClick={() => onToggleRelease(wf)}
                        disabled={busy === wf.id}
                        title={online ? t('offline') : t('online')}
                        className={`mono flex items-center gap-1 rounded-[var(--radius)] border px-1.5 py-1 text-[10px] disabled:opacity-50 ${
                          online ? 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]' : 'border-emerald-500/40 text-emerald-400 hover:border-emerald-500/70'
                        }`}
                      >
                        {online ? <PowerOff size={11} /> : <Power size={11} />}
                      </button>
                    </div>
                  </div>
                );
              })}
              {!loadingList && workflows.length === 0 && (
                <p className="mono px-2 py-4 text-center text-xs text-[var(--muted-foreground)]">{t('noWorkflows')}</p>
              )}
            </div>
          </div>

          {/* DAG 画布 */}
          <div className="relative bg-[var(--background)]">
            {loadingDag && (
              <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--muted-foreground)]">
                <Loader2 size={13} className="animate-spin" /> {t('loading')}
              </div>
            )}
            {!selected ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
                <WorkflowIcon size={28} className="opacity-40" />
                <p className="mono text-xs">{t('selectWorkflow')}</p>
              </div>
            ) : dag.nodes.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
                <p className="mono text-xs">{t('noDag')}</p>
                <p className="mono text-[10px] break-all px-8 text-center opacity-60">{selected.name}</p>
              </div>
            ) : (
              <ReactFlow
                nodes={dag.nodes}
                edges={dag.edges}
                nodeTypes={nodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{ animated: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
                <Controls className="!rounded !border !border-[var(--border)] !bg-[var(--card)]" />
                <MiniMap className="!rounded !border !border-[var(--border)] !bg-[var(--card)]" nodeColor={() => 'var(--primary)'} maskColor="rgba(0,0,0,0.4)" />
              </ReactFlow>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InstancesView({ data, loading, t, onPage }: {
  data: PageResult<Record<string, unknown>> | null;
  loading: boolean;
  t: (k: string) => string;
  onPage: (page: number) => void;
}) {
  const list = data?.records ?? [];

  // DS 2.x ExecutionStatus：0提交 1运行 2暂停 3 ready pause 4 prepare pause 5 fail 6 success 7 stop 8 stop 9等待线程 10等待依赖
  const stateText = (s: unknown): string => {
    const n = Number(s);
    const map: Record<number, string> = { 0: '提交', 1: '运行中', 2: '暂停', 5: '失败', 6: '成功', 7: '停止', 8: '停止', 9: '等待', 10: '等待依赖' };
    return map[n] ?? (s != null ? String(s) : '—');
  };
  const stateColor = (s: unknown): string => {
    const n = Number(s);
    if (n === 6) return 'text-emerald-400';
    if (n === 5) return 'text-red-400';
    if (n === 1) return 'text-[var(--primary)]';
    if (n === 0 || n === 9 || n === 10) return 'text-[var(--muted-foreground)]';
    return 'text-[var(--muted-foreground)]';
  };
  const fmtTime = (s: unknown): string => (s != null ? String(s).replace('T', ' ').replace(/\.\d+\+\d+$/, '') : '—');
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border)]">
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">
            <Loader2 size={13} className="mr-1.5 inline animate-spin" /> {t('loading')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="mono border-b border-[var(--border)] text-left text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-normal">id</th>
                <th className="px-4 py-3 font-normal">{t('colName')}</th>
                <th className="px-4 py-3 font-normal">{t('colState')}</th>
                <th className="px-4 py-3 font-normal">{t('colRunTime')}</th>
                <th className="px-4 py-3 font-normal">{t('colExecutor')}</th>
                <th className="px-4 py-3 font-normal">{t('colStartTime')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ins, i) => (
                <tr key={String(ins.id ?? i)} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-2)]/60">
                  <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{String(ins.id ?? '')}</td>
                  <td className="mono px-4 py-3 text-xs font-medium text-[var(--foreground)]">{String(ins.name ?? '')}</td>
                  <td className={`mono px-4 py-3 text-xs ${stateColor(ins.state)}`}>{stateText(ins.state)}</td>
                  <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{String(ins.runTimes ?? ins.duration ?? '')}</td>
                  <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{String(ins.executorName ?? '')}</td>
                  <td className="mono px-4 py-3 text-xs text-[var(--muted-foreground)]">{fmtTime(ins.startTime)}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="mono px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">{t('noInstances')}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={data} onPage={onPage} className="border-t border-[var(--border)]" />
    </div>
  );
}
