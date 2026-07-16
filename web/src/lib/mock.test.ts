import { describe, it, expect } from 'vitest';
import { mockFetch } from './mock';
import { API_PATHS } from './apiPaths';

describe('mockFetch', () => {
  it('returns 8 mock projects', async () => {
    const res = await mockFetch<{ projects: unknown[] }>(
      `${API_PATHS.PROJECT}getAllProjects`,
    );
    expect(res.projects).toHaveLength(8);
  });

  it('returns orchestrators scoped by projectId', async () => {
    // etl_pipeline (id 102) 声明 orchestratorCount=5
    const res = await mockFetch<{ page: unknown[]; total: number }>(
      `${API_PATHS.ORCHESTRATOR}getAllOrchestrator`,
      { projectId: 102 },
    );
    expect(res.page).toHaveLength(5);
    expect(res.total).toBe(5);
  });

  it('accepts projectId as string', async () => {
    const res = await mockFetch<{ page: unknown[] }>(
      `${API_PATHS.ORCHESTRATOR}getAllOrchestrator`,
      { projectId: '104' },
    );
    // risk_report (id 104) 声明 orchestratorCount=6
    expect(res.page).toHaveLength(6);
  });

  it('falls back to default when projectId missing', async () => {
    const res = await mockFetch<{ page: unknown[] }>(
      `${API_PATHS.ORCHESTRATOR}getAllOrchestrator`,
    );
    expect(res.page.length).toBeGreaterThan(0);
  });

  it('returns application areas', async () => {
    const res = await mockFetch<{ applicationAreas: string[] }>(
      `${API_PATHS.PROJECT}listApplicationAreas`,
    );
    expect(res.applicationAreas).toContain('基础科技');
  });
});
