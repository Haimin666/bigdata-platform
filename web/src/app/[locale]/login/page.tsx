'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { login, fetchIsAdmin, setLocale, getBaseInfo, demoLogin } from '@/lib/auth';
import { platformMode } from '@/lib/platform';
import { ThemeToggle } from '@/components/shell/ThemeToggle';
import { Loader2, Sparkles, ArrowRight, Terminal } from 'lucide-react';
import { toast } from 'sonner';

const BOOT_LINES = [
  '> initializing linkis compute middleware ......... ok',
  '> loading lineage / scheduler / realtime plugins .. ok',
  '> establishing data governance channel ............. ok',
  '> platform console ready ▮',
];

const TICKER = [
  'LINEAGE NODES 1.2K', 'WORKFLOWS 142', 'RUNNING JOBS 38', 'TASKS/24H 208',
  'ENGINES SPARK·FLINK·SQOOP·PYTHON', 'UPTIME 99.98%', 'TENANTS 36',
];

export default function LoginPage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    setLocale(locale);
    if (getBaseInfo()) router.replace('/lineage');
  }, [locale, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.trim() || !password) return;
    setLoading(true);
    try {
      const rst = await login(user, password);
      if (rst?.redirectLinkisUrl) {
        window.location.href = rst.redirectLinkisUrl;
        return;
      }
      // 平台模式：登录已含 isAdmin，直接进入平台首页，不再调 Linkis workspace 接口
      if (platformMode()) {
        toast.success(t('loginSuccess'));
        router.replace('/lineage');
        return;
      }
      const isAdmin = await fetchIsAdmin();
      const base = getBaseInfo();
      if (base) base.isAdmin = isAdmin;
      toast.success(t('loginSuccess'));
      router.replace('/lineage');
    } catch (err) {
      toast.error((err as Error).message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      router.replace('/lineage');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
      {/* ---- left: data console panel ---- */}
      <aside className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[var(--card)] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(70% 60% at 80% 0%, oklch(81% 0.135 78 / 0.12) 0%, transparent 60%), radial-gradient(50% 50% at 0% 100%, oklch(72% 0.13 195 / 0.1) 0%, transparent 60%)',
          }}
        />
        {/* scanline */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30"
          style={{
            background: 'linear-gradient(oklch(81% 0.135 78 / 0.18), transparent)',
            animation: 'scanline 7s linear infinite',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Terminal size={20} />
            </span>
            <span className="mono-label">Bigdata Platform · Console</span>
          </div>

          <h1 className="mt-12 max-w-md text-5xl font-bold leading-[1.05] tracking-tight">
            数据工程，
            <br />
            <span className="amber-text">统一编排</span>。
          </h1>
          <p className="mt-5 max-w-sm text-[var(--muted-foreground)]">
            从数据接入、清洗、分析、挖掘到调度发布的一站式数据应用开发管理门户。金融级高并发、多租户隔离。
          </p>

          <div className="mono mt-12 max-w-md space-y-1.5 text-xs text-[var(--muted-foreground)]">
            {BOOT_LINES.map((line, i) => (
              <div
                key={i}
                className="reveal"
                style={{ animationDelay: `${0.15 + i * 0.12}s` }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* ticker */}
        <div className="relative">
          <div className="mono-label mb-2">// live telemetry</div>
          <div className="overflow-hidden border-y border-[var(--border)] py-2">
            <div className="mono flex w-max gap-8 text-xs text-[var(--muted-foreground)]" style={{ animation: 'ticker 28s linear infinite' }}>
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="amber-text">◢</span> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ---- right: form ---- */}
      <main className="relative flex items-center justify-center p-6">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="reveal w-full max-w-sm" style={{ animationDelay: '0.1s' }}>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Terminal size={20} />
            </span>
            <span className="mono-label">Bigdata Platform</span>
          </div>

          <p className="mono-label mb-3">// authenticate</p>
          <h2 className="text-3xl font-bold tracking-tight">登录控制台</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            输入凭据进入平台，或使用演示模式浏览界面。
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="mono-label">{t('username')}</Label>
              <Input
                id="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder={t('username')}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="mono-label">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {t('login')}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="mono">OR</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={demoLoading}
            onClick={enterDemo}
          >
            {demoLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            跳过登录（演示模式）
          </Button>
          <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            演示模式使用假数据，无需后端即可浏览界面
          </p>
        </div>
      </main>
    </div>
  );
}
