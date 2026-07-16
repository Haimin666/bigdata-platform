import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/apiPaths';
import type { RunResult, ScriptItem, ScriptType } from '@/lib/types';

// 脚本类型 → Linkis runType
function toRunType(type: ScriptType): string {
  if (type === 'python') return 'python';
  if (type === 'shell') return 'sh';
  if (type === 'scala') return 'scala';
  return 'sql';
}

export async function fetchScripts(): Promise<ScriptItem[]> {
  const res = await api.fetch<{ files: ScriptItem[] }>(
    `${API_PATHS.FILESYSTEM}getDirFileTrees`,
  );
  return res?.files ?? [];
}

export async function openScript(name: string): Promise<ScriptItem | undefined> {
  const res = await api.fetch<{ script: ScriptItem }>(`${API_PATHS.FILESYSTEM}openFile`, {
    fileName: name,
  });
  return res?.script;
}

export async function saveScript(script: ScriptItem): Promise<void> {
  await api.fetch(`${API_PATHS.FILESYSTEM}saveScript`, {
    fileName: script.name,
    scriptContent: script.content,
  });
}

export async function runScript(script: ScriptItem): Promise<RunResult> {
  const res = await api.fetch<RunResult>(`${API_PATHS.ENTRANCE}execute`, {
    executionCode: script.content,
    runType: toRunType(script.type),
    engineType: script.type.startsWith('spark')
      ? 'spark'
      : script.type.startsWith('hive')
        ? 'hive'
        : script.type,
  });
  return res;
}
