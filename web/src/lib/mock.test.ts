import { describe, it, expect } from 'vitest';
import { mockFetch } from './mock';
import { API_PATHS } from './apiPaths';

describe('mockFetch', () => {
  it('returns script tree for scriptis', async () => {
    const res = await mockFetch<{ files: unknown[] }>(
      `${API_PATHS.FILESYSTEM}getDirFileTrees`,
    );
    expect(res.files.length).toBeGreaterThan(0);
  });

  it('opens a script by name', async () => {
    const res = await mockFetch<{ script: { name: string } }>(
      `${API_PATHS.FILESYSTEM}openFile`,
      { fileName: 'user_stats.sql' },
    );
    expect(res.script.name).toBe('user_stats.sql');
  });

  it('returns run result for sql execute', async () => {
    const res = await mockFetch<{ taskId: string; rows: unknown[][] }>(
      `${API_PATHS.ENTRANCE}execute`,
      { runType: 'sql' },
    );
    expect(res.taskId).toContain('task_sql_');
    expect(res.rows.length).toBeGreaterThan(0);
  });

  it('returns mock data sources', async () => {
    const res = await mockFetch<{ list: unknown[] }>(
      `${API_PATHS.DATASOURCE}listDataSources`,
    );
    expect(res.list.length).toBeGreaterThan(0);
  });

  it('returns mock data assets', async () => {
    const res = await mockFetch<{ assets: unknown[] }>(
      `${API_PATHS.DATA_GOVERNANCE}listAssets`,
    );
    expect(res.assets.length).toBeGreaterThan(0);
  });
});
