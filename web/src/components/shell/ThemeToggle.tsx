'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'dark' | 'light';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const cur = (document.documentElement.dataset.theme as Theme) || 'dark';
    setTheme(cur);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切换主题"
      title={theme === 'dark' ? '切换到浅色' : '切换到深色'}
      className="grid h-9 w-9 place-items-center rounded-[var(--radius)] border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]"
    >
      {mounted && theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
