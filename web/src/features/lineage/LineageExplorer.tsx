'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Search, GitBranch, AlertTriangle } from 'lucide-react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  getLineage,
  searchLineage,
  type LineageEntity,
  type LineageGraph,
} from '@/lib/platform';

interface LineageNodeData extends Record<string, unknown> {
  label: string;
  entityType: string;
  fqn: string;
  deleted: boolean;
  focal: boolean;
}

const ENTITY_COLORS: Record<string, string> = {
  table: 'var(--primary)',
  dashboard: '#60a5fa',
  pipeline: '#34d399',
  topic: '#f472b6',
  search_index: '#fbbf24',
};

/** 简易分层布局：以焦点节点为 0 层，BFS 双向定层，按层列排布。 */
function layout(graph: LineageGraph): { nodes: Node<LineageNodeData>[]; edges: Edge[] } {
  const focalFqn = graph.fqn;
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const focal = graph.nodes.find((n) => n.fqn === focalFqn || n.id === 'self') ?? graph.nodes[0];
  const focalId = focal?.id ?? '';

  // BFS：source→target 视为下游（+1），反向为上游（-1）
  const dist = new Map<string, number>([[focalId, 0]]);
  const adj = new Map<string, string[]>();
  const radj = new Map<string, string[]>();
  for (const e of graph.edges) {
    (adj.get(e.source) ?? adj.set(e.source, []).get(e.source)!).push(e.target);
    (radj.get(e.target) ?? radj.set(e.target, []).get(e.target)!).push(e.source);
  }
  let frontier = [focalId];
  for (let depth = 1; depth <= 6; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const t of adj.get(id) ?? []) if (!dist.has(t)) { dist.set(t, depth); next.push(t); }
    }
    frontier = next;
    if (!next.length) break;
  }
  frontier = [focalId];
  for (let depth = 1; depth <= 6; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const t of radj.get(id) ?? []) if (!dist.has(t)) { dist.set(t, -depth); next.push(t); }
    }
    frontier = next;
    if (!next.length) break;
  }

  const byLayer = new Map<number, string[]>();
  for (const n of graph.nodes) {
    const d = dist.get(n.id) ?? 0;
    (byLayer.get(d) ?? byLayer.set(d, []).get(d)!).push(n.id);
  }

  const COL = 240;
  const ROW = 88;
  const nodes: Node<LineageNodeData>[] = [];
  for (const [layer, ids] of byLayer) {
    const sorted = [...ids].sort();
    sorted.forEach((id, idx) => {
      const n = byId.get(id)!;
      const count = sorted.length;
      nodes.push({
        id,
        position: { x: layer * COL, y: (idx - (count - 1) / 2) * ROW },
        data: {
          label: n.label || n.fqn,
          entityType: n.entityType,
          fqn: n.fqn,
          deleted: n.deleted,
          focal: id === focalId,
        },
      });
    });
  }

  const edges: Edge[] = graph.edges.map((e, i) => ({
    id: `e${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    animated: true,
  }));

  return { nodes, edges };
}

function NodeCard({ data }: { data: LineageNodeData }) {
  const color = ENTITY_COLORS[data.entityType] ?? 'var(--muted-foreground)';
  return (
    <div
      className={`mono min-w-[160px] rounded-[var(--radius)] border px-3 py-2 text-xs ${
        data.focal
          ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[0_0_16px_var(--amber-glow)]'
          : 'border-[var(--border)] bg-[var(--card)]'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate font-medium text-[var(--foreground)]">{data.label}</span>
        {data.deleted && <AlertTriangle size={11} className="shrink-0 text-amber-500" />}
      </div>
      <div className="mt-0.5 truncate text-[10px] text-[var(--muted-foreground)]">{data.fqn}</div>
      <div className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">{data.entityType}</div>
    </div>
  );
}

const nodeTypes = { lineage: NodeCard };

export function LineageExplorer() {
  const t = useTranslations('lineage');
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<LineageEntity[]>([]);
  const [graph, setGraph] = useState<LineageGraph | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);

  const onSearch = useCallback(async () => {
    const q = keyword.trim();
    if (!q) return;
    setSearching(true);
    try {
      setResults(await searchLineage(q, 20));
    } catch (e) {
      toast.error((e as Error).message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [keyword]);

  const onSelect = useCallback(async (entity: LineageEntity) => {
    setLoadingGraph(true);
    setResults([]);
    try {
      setGraph(await getLineage(entity.entityType || 'table', entity.fqn, 2, 2));
      toast.success(t('loaded', { fqn: entity.fqn }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingGraph(false);
    }
  }, [t]);

  const onNodeClick = useCallback<NodeMouseHandler<Node<LineageNodeData>>>(
    async (_evt, node) => {
      const d = node.data;
      if (d.focal) return;
      setLoadingGraph(true);
      try {
        setGraph(await getLineage(d.entityType || 'table', d.fqn, 2, 2));
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoadingGraph(false);
      }
    },
    [],
  );

  const { nodes, edges } = useMemo(() => (graph ? layout(graph) : { nodes: [], edges: [] }), [graph]);

  return (
    <div className="grid h-full grid-cols-[300px_1fr] overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border)]">
      <div className="flex flex-col border-r border-[var(--border)] bg-[var(--card)]/60">
        <div className="border-b border-[var(--border)] px-3 py-2.5">
          <p className="mono-label">// lineage search</p>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={t('searchPlaceholder')}
              className="mono w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]/60"
            />
            <button
              onClick={onSearch}
              disabled={searching}
              className="mono flex shrink-0 items-center gap-1 rounded-[var(--radius)] bg-[var(--primary)] px-2.5 py-1.5 text-xs text-black hover:opacity-90 disabled:opacity-50"
            >
              {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            </button>
          </div>

          <div className="max-h-[60vh] space-y-1 overflow-auto">
            {results.map((r) => (
              <button
                key={r.fqn}
                onClick={() => onSelect(r)}
                className="block w-full rounded-[var(--radius)] border border-[var(--border)] px-2.5 py-1.5 text-left transition-colors hover:border-[var(--primary)]/50 hover:bg-[var(--surface-2)]/60"
              >
                <div className="truncate text-xs font-medium text-[var(--foreground)]">{r.displayName || r.name}</div>
                <div className="mono truncate text-[10px] text-[var(--muted-foreground)]">{r.fqn}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative bg-[var(--background)]">
        {loadingGraph && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--muted-foreground)]">
            <Loader2 size={13} className="animate-spin" /> {t('loading')}
          </div>
        )}
        {nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--muted-foreground)]">
            <GitBranch size={28} className="opacity-40" />
            <p className="mono text-xs">{t('empty')}</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ animated: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
            <Controls className="!rounded !border !border-[var(--border)] !bg-[var(--card)]" />
            <MiniMap
              className="!rounded !border !border-[var(--border)] !bg-[var(--card)]"
              nodeColor={() => 'var(--primary)'}
              maskColor="rgba(0,0,0,0.4)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
