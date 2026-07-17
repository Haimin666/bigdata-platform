export interface BaseInfo {
  username: string;
  isAdmin?: boolean;
}

export interface PublicKeyData {
  enableLoginEncrypt: boolean;
  publicKey: string;
}

export interface LoginResult {
  redirectLinkisUrl?: string;
}

export type ScriptType = 'spark.sql' | 'hive.sql' | 'python' | 'shell' | 'scala';

export interface ScriptItem {
  id: string;
  name: string;
  type: ScriptType;
  content?: string;
  updateBy?: string;
  updateTime?: string;
  path?: string;
}

export interface RunResultColumn {
  name: string;
  type?: string;
}

export interface RunResult {
  taskId: string;
  status: 'success' | 'failed' | 'running';
  columns: RunResultColumn[];
  rows: unknown[][];
  durationMs: number;
  log: string[];
  message?: string;
}

export interface DataSourceItem {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  database?: string;
  status: 'connected' | 'offline';
  createBy?: string;
}

export interface DataAssetItem {
  id: number;
  name: string;
  type: 'table' | 'view' | 'database';
  database: string;
  comment?: string;
  rowCount?: number;
  sizeMb?: number;
  owner?: string;
  updateTime?: string;
}
