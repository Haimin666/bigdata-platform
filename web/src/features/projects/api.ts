import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/apiPaths';
import { platformMode, getPlatformProjects, createPlatformProject } from '@/lib/platform';
import type { ProjectItem } from '@/lib/types';

export interface CreateProjectInput {
  name: string;
  description: string;
  business?: string;
  applicationArea?: string;
  product?: string;
  workspaceId: number;
}

export async function fetchProjects(workspaceId: number): Promise<ProjectItem[]> {
  if (platformMode()) return getPlatformProjects(workspaceId);
  const res = await api.fetch<{ projects: ProjectItem[] }>(
    `${API_PATHS.PROJECT}getAllProjects`,
    { workspaceId },
  );
  return res?.projects ?? [];
}

export async function createProject(input: CreateProjectInput) {
  if (platformMode()) return createPlatformProject(input);
  return api.fetch(`${API_PATHS.PROJECT}createProject`, input);
}

export async function fetchApplicationAreas(): Promise<string[]> {
  // 平台模式暂无此接口，返回常用领域
  if (platformMode()) return ['基础科技', '算法', '风控', '治理', '增长'];
  const res = await api.fetch<{ applicationAreas: string[] }>(
    `${API_PATHS.PROJECT}listApplicationAreas`,
    { method: 'get' },
  );
  return res?.applicationAreas ?? [];
}
