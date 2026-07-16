'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { mockAppConns } from '@/lib/mock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Activity } from 'lucide-react';

// 各子应用的 mock 指标（演示用）
const APP_METRICS: Record<string, { label: string; value: string }[]> = {
  scriptis: [
    { label: '脚本总数', value: '128' },
    { label: '今日执行', value: '1,204' },
    { label: '成功率', value: '98.6%' },
  ],
  visualis: [
    { label: '仪表盘', value: '32' },
    { label: '图表', value: '186' },
    { label: '今日访问', value: '452' },
  ],
  schedulis: [
    { label: '调度任务', value: '240' },
    { label: '运行中', value: '18' },
    { label: '失败', value: '3' },
  ],
  qualitis: [
    { label: '校验规则', value: '96' },
    { label: '通过率', value: '99.2%' },
    { label: '告警', value: '7' },
  ],
};

const APP_RECENT: Record<string, string[]> = {
  scriptis: ['user_stats.sql · 成功 · 2.1s', 'etl_orders.sql · 成功 · 5.4s', 'feature_build.py · 成功 · 1.8s'],
  visualis: ['用户增长看板 · 已发布', '订单实时大盘 · 编辑中', '风控指标卡 · 已发布'],
  schedulis: ['dwd_orders_daily · 运行中', 'user_labels_daily · 等待', 'risk_report_t1 · 成功'],
  qualitis: ['dwd_orders 空值校验 · 通过', 'user_access_log 量级校验 · 告警', 'dss_demo 一致性 · 通过'],
};

export function AppConnDashboard({ appKey }: { appKey: string }) {
  const t = useTranslations('apps');
  const app = mockAppConns.find((a) => a.key === appKey);
  const metrics = APP_METRICS[appKey] ?? [
    { label: '资源数', value: '—' },
    { label: '今日', value: '—' },
    { label: '状态', value: app?.status ?? '—' },
  ];
  const recent = APP_RECENT[appKey] ?? ['暂无近期记录'];

  return (
    <div className="space-y-6">
      <Link
        href="/apps"
        className="mono inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
      >
        <ArrowLeft size={13} /> {t('back')}
      </Link>

      <section className="reveal">
        <p className="mono-label">// appconn</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{app?.name ?? appKey}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">{app?.description}</p>
      </section>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="mono text-[9px] uppercase tracking-wider text-[var(--muted-foreground)]">
                {m.label}
              </p>
              <p className="mono mt-1 text-2xl text-[var(--foreground)]">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity size={15} className="amber-text" />
            <span className="mono-label">{t('recent')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="mono space-y-2 text-xs">
            {recent.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <span className="amber-text">›</span>
                <span className="text-[var(--foreground)]">{r}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="mono text-xs text-[var(--muted-foreground)]">
        {t('mockNote')}
      </p>
    </div>
  );
}
