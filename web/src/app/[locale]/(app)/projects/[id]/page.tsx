import { AppShell } from '@/components/shell/AppShell';
import { ProjectDetailContent } from './ProjectDetailContent';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const projectId = Number(id);

  return (
    <AppShell>
      <ProjectDetailContent projectId={projectId} />
    </AppShell>
  );
}
