'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { mockAppConns } from '@/lib/mock';
import type { AppConnItem } from '@/lib/types';
import { ArrowUpRight } from 'lucide-react';

const CATEGORY_LABEL: Record<AppConnItem['category'], string> = {
  develop: '开发',
  schedule: '调度',
  quality: '质量',
  exchange: '交换',
  stream: '流式',
  ml: '机器学习',
  visual: '可视化',
};

const STATUS_STYLE: Record<AppConnItem['status'], string> = {
  online: 'bg-emerald-400',
  offline: 'bg-zinc-500',
  soon: 'bg-amber-400',
};

const STATUS_LABEL: Record<AppConnItem['status'], string> = {
  online: '在线',
  offline: '离线',
  soon: '即将上线',
};

export function AppConnGrid() {
  const t = useTranslations('apps');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mockAppConns.map((app, i) => {
        const disabled = app.status !== 'online';
        const inner = (
          <div
            className="reveal group flex h-full flex-col rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--card)] p-5 transition-all"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-[var(--radius)] bg-[var(--surface-2)] text-lg font-bold text-[var(--primary)]">
                {app.name[0]}
              </span>
              <span className="mono inline-flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[app.status]}`} />
                {STATUS_LABEL[app.status]}
              </span>
            </div>
            <h3 className="mt-3 font-semibold">{app.name}</h3>
            <p className="mt-1 flex-1 text-sm text-[var(--muted-foreground)]">{app.description}</p>
            <div className="mono mt-4 flex items-center justify-between text-[10px]">
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[var(--muted-foreground)]">
                {CATEGORY_LABEL[app.category]}
              </span>
              {!disabled && (
                <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100">
                  {t('enter')} <ArrowUpRight size={12} />
                </span>
              )}
            </div>
          </div>
        );
        return disabled ? (
          <div key={app.key} className="opacity-60">
            {inner}
          </div>
        ) : (
          <Link key={app.key} href={`/apps/${app.key}`} className="block hover:[&>div]:-translate-y-0.5 hover:[&>div]:border-[var(--primary)]/50 hover:[&>div]:shadow-[0_0_28px_-10px_var(--amber-glow)]">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
