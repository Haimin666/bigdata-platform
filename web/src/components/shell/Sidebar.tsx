'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Home, FolderKanban, FileCode2, Workflow, LayoutGrid, Database, ShieldCheck, GitBranch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
}

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: '/workspaceHome', icon: Home, label: t('home'), exact: true },
    { href: '/projects', icon: FolderKanban, label: t('projects') },
    { href: '/scriptis', icon: FileCode2, label: t('scriptis') },
    { href: '/workflow', icon: Workflow, label: t('workflow') },
    { href: '/apps', icon: LayoutGrid, label: t('apps') },
    { href: '/datasource', icon: Database, label: t('datasource') },
    { href: '/governance', icon: ShieldCheck, label: t('governance') },
    { href: '/lineage', icon: GitBranch, label: t('lineage') },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(item.href + '/') === true;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)]/60 p-4 lg:flex">
      <p className="mono-label px-3 pb-3 pt-1">// navigate</p>
      <nav className="space-y-0.5">
        {items.map(({ href, icon: Icon, label }) => {
          const active = isActive({ href, icon: Icon, label } as NavItem);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm transition-all ${
                active
                  ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-2)]/60 hover:text-[var(--foreground)]'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--amber-glow)]" />
              )}
              <Icon size={16} className={active ? 'amber-text' : ''} />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]/40 p-3">
        <p className="mono-label">// status</p>
        <div className="mono mt-2 flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
          </span>
          <span className="text-[var(--muted-foreground)]">linkis · online</span>
        </div>
      </div>
    </aside>
  );
}
