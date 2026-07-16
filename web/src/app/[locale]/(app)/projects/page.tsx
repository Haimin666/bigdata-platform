'use client';

import { AppShell } from '@/components/shell/AppShell';
import { ProjectList } from '@/features/projects/ProjectList';
import { useWorkspaces, getCurrentWorkspaceId, setCurrentWorkspaceId } from '@/features/workspace/useWorkspace';
import { useEffect, useState } from 'react';

export default function ProjectsPage() {
  const { data } = useWorkspaces();
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    const stored = getCurrentWorkspaceId();
    if (stored !== null) setWorkspaceId(stored);
    else if (data && data.length > 0) {
      const def = data.find((w) => w.isDefaultWorkspace) ?? data[0];
      setCurrentWorkspaceId(def.id);
      setWorkspaceId(def.id);
    }
  }, [data]);

  return (
    <AppShell>
      {workspaceId ? <ProjectList workspaceId={workspaceId} /> : null}
    </AppShell>
  );
}
