'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PageResult } from '@/lib/platform';

interface PaginationProps {
  page: PageResult<unknown> | undefined | null;
  onPage: (page: number) => void;
  className?: string;
}

/** 通用分页控件：基于后端统一 PageResult {page,pageSize,total,totalPage}。 */
export function Pagination({ page, onPage, className }: PaginationProps) {
  const total = page?.total ?? 0;
  const current = page?.page ?? 1;
  const totalPage = page?.totalPage ?? 1;
  if (total === 0) return null;
  const cur = Math.min(Math.max(current, 1), totalPage);
  const hasPrev = cur > 1;
  const hasNext = cur < totalPage;
  return (
    <div className={cn('flex items-center justify-between gap-3 px-1 py-2 text-xs', className)}>
      <span className="mono text-[10px] text-[var(--muted-foreground)]">
        共 {total} 条 · 第 {cur} / {totalPage} 页
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => hasPrev && onPage(cur - 1)}
          disabled={!hasPrev}
          className="mono flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)] disabled:opacity-40 disabled:hover:border-[var(--border)]"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="mono px-2 text-[var(--foreground)]">{cur}</span>
        <button
          onClick={() => hasNext && onPage(cur + 1)}
          disabled={!hasNext}
          className="mono flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)] disabled:opacity-40 disabled:hover:border-[var(--border)]"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
