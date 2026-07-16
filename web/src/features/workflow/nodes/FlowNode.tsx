'use client';

import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Database, Cpu, Braces, Radio } from 'lucide-react';

export type FlowNodeKind = 'sql' | 'spark' | 'python' | 'signal';

export interface FlowNodeData {
  label: string;
  kind: FlowNodeKind;
  [key: string]: unknown;
}

const KIND_META: Record<FlowNodeKind, { icon: typeof Database; accent: string }> = {
  sql: { icon: Database, accent: 'var(--primary)' },
  spark: { icon: Cpu, accent: '#f59e0b' },
  python: { icon: Braces, accent: '#38bdf8' },
  signal: { icon: Radio, accent: '#a78bfa' },
};

function FlowNodeImpl({ data }: NodeProps<Node<FlowNodeData>>) {
  const d = data;
  const meta = KIND_META[d.kind] ?? KIND_META.sql;
  const Icon = meta.icon;
  return (
    <div className="min-w-[150px] rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-md transition-shadow hover:shadow-[0_0_22px_-8px_var(--amber-glow)]">
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--muted-foreground)]" />
      <div className="flex items-center gap-2">
        <span
          className="grid h-7 w-7 place-items-center rounded-[var(--radius)]"
          style={{ backgroundColor: 'var(--surface-2)', color: meta.accent }}
        >
          <Icon size={14} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold leading-tight">{d.label}</p>
          <p className="mono text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">
            {d.kind}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--primary)]" />
    </div>
  );
}

export const FlowNode = memo(FlowNodeImpl);
