import { AppShell } from '@/components/shell/AppShell';
import { AppConnDashboard } from '@/features/apps/AppConnDashboard';

export default async function AppConnDetailPage({
  params,
}: {
  params: Promise<{ locale: string; app: string }>;
}) {
  const { app } = await params;
  return (
    <AppShell>
      <AppConnDashboard appKey={app} />
    </AppShell>
  );
}
