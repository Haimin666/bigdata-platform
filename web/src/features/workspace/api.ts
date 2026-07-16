import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/apiPaths';
import { platformMode, getPlatformWorkspaces } from '@/lib/platform';
import type { WorkspaceItem } from '@/lib/types';

export async function fetchWorkspaces(): Promise<WorkspaceItem[]> {
  if (platformMode()) return getPlatformWorkspaces();
  const res = await api.fetch<{ workspaces: WorkspaceItem[] }>(
    `${API_PATHS.WORKSPACE}workspaces`,
    { method: 'get' },
  );
  return res?.workspaces ?? [];
}
