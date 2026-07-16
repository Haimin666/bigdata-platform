'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowNode, type FlowNodeData, type FlowNodeKind } from './nodes/FlowNode';
import { Database, Cpu, Braces, Radio, Save, Trash2 } from 'lucide-react';

const nodeTypes = { dss: FlowNode };

const initialNodes: Node<FlowNodeData>[] = [
  { id: 'n1', type: 'dss', position: { x: 80, y: 120 }, data: { label: 'ods_user_access', kind: 'sql' } },
  { id: 'n2', type: 'dss', position: { x: 340, y: 80 }, data: { label: 'feature_build', kind: 'python' } },
  { id: 'n3', type: 'dss', position: { x: 340, y: 200 }, data: { label: 'spark_agg', kind: 'spark' } },
  { id: 'n4', type: 'dss', position: { x: 600, y: 140 }, data: { label: 'notify_signal', kind: 'signal' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'n1', target: 'n2', animated: true },
  { id: 'e1-3', source: 'n1', target: 'n3' },
  { id: 'e2-4', source: 'n2', target: 'n4' },
  { id: 'e3-4', source: 'n3', target: 'n4' },
];

const PALETTE: { kind: FlowNodeKind; label: string; icon: typeof Database }[] = [
  { kind: 'sql', label: 'SQL', icon: Database },
  { kind: 'spark', label: 'Spark', icon: Cpu },
  { kind: 'python', label: 'Python', icon: Braces },
  { kind: 'signal', label: 'Signal', icon: Radio },
];

export function Canvas() {
  const t = useTranslations('workflow');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [seq, setSeq] = useState(initialNodes.length + 1);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const addNode = (kind: FlowNodeKind) => {
    const id = `n${seq}`;
    setSeq((s) => s + 1);
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'dss',
        position: { x: 120 + (seq % 5) * 40, y: 320 + (seq % 5) * 30 },
        data: { label: `${kind}_${seq}`, kind },
      },
    ]);
  };

  const clearAll = () => {
    setNodes([]);
    setEdges([]);
    toast.info(t('cleared'));
  };

  const save = () => {
    // 演示保存：真实后端为 WORKFLOW_PATH + saveFlow
    toast.success(t('saved', { nodes: nodes.length, edges: edges.length }));
  };

  return (
    <div className="grid h-full grid-cols-[180px_1fr] overflow-hidden rounded-[calc(var(--radius)+4px)] border border-[var(--border)]">
      <div className="flex flex-col border-r border-[var(--border)] bg-[var(--card)]/60">
        <div className="border-b border-[var(--border)] px-3 py-2.5">
          <p className="mono-label">// palette</p>
        </div>
        <div className="space-y-1.5 p-2">
          {PALETTE.map(({ kind, label, icon: Icon }) => (
            <button
              key={kind}
              onClick={() => addNode(kind)}
              className="flex w-full items-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border)] px-2.5 py-2 text-left text-sm text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
            >
              <Icon size={14} className="amber-text" />
              <span className="flex-1">{label}</span>
              <span className="mono text-[10px]">+</span>
            </button>
          ))}
        </div>
        <div className="mt-auto space-y-1.5 p-2">
          <button
            onClick={save}
            className="mono flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[var(--primary)] px-2.5 py-2 text-xs text-black transition-opacity hover:opacity-90"
          >
            <Save size={13} /> {t('save')}
          </button>
          <button
            onClick={clearAll}
            className="mono flex w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] px-2.5 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <Trash2 size={13} /> {t('clear')}
          </button>
        </div>
      </div>

      <div className="relative bg-[var(--background)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
      </div>
    </div>
  );
}
