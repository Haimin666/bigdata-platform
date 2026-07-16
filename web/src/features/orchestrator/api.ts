import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/apiPaths';
import type { OrchestratorItem } from '@/lib/types';

// 对应后端 ORCHESTRATOR_PATH + getAllOrchestrator（POST {projectId} → {page:[]})
export async function fetchOrchestrators(projectId: number): Promise<OrchestratorItem[]> {
  const res = await api.fetch<{ page: OrchestratorItem[]; total?: number }>(
    `${API_PATHS.ORCHESTRATOR}getAllOrchestrator`,
    { projectId },
  );
  return res?.page ?? [];
}
