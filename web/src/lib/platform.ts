import axios, { type AxiosInstance } from 'axios';
import type { BaseInfo, ProjectItem, WorkspaceItem } from './types';

const PLATFORM_API = process.env.NEXT_PUBLIC_PLATFORM_API || '';
const TOKEN_KEY = 'platform_token';

/** 是否启用真后端平台服务（NEXT_PUBLIC_USE_PLATFORM=true 且配置了地址） */
export function platformMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_PLATFORM === 'true' && !!PLATFORM_API;
}

export function platformApiBase(): string {
  return PLATFORM_API;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

const instance: AxiosInstance = axios.create({
  baseURL: `${PLATFORM_API}/api/platform`,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
});

instance.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

instance.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;
    if (payload && typeof payload === 'object' && 'status' in payload) {
      if (payload.status !== 0) {
        return Promise.reject(new Error(payload.message || '请求失败'));
      }
      return { ...response, data: payload.data };
    }
    return response;
  },
  (error) => Promise.reject(new Error(error?.response?.data?.message || error?.message || '请求失败')),
);

async function get<T>(url: string): Promise<T> {
  const res = await instance.get<unknown, { data: T }>(url);
  return res.data;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await instance.post<unknown, { data: T }>(url, body);
  return res.data;
}

export interface PlatformLoginResult {
  token: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
}

export async function platformLogin(username: string, password: string): Promise<PlatformLoginResult> {
  const r = await post<PlatformLoginResult>('/auth/login', { username, password });
  setToken(r.token);
  return r;
}

export async function getPlatformMe(): Promise<BaseInfo> {
  return get<BaseInfo>('/auth/me');
}

export async function getPlatformWorkspaces(): Promise<WorkspaceItem[]> {
  return get<WorkspaceItem[]>('/workspaces');
}

export async function getPlatformProjects(workspaceId: number): Promise<ProjectItem[]> {
  return get<ProjectItem[]>(`/projects?workspaceId=${workspaceId}`);
}

export interface CreatePlatformProjectInput {
  name: string;
  description?: string;
  business?: string;
  applicationArea?: string;
  workspaceId: number;
}

export async function createPlatformProject(input: CreatePlatformProjectInput): Promise<ProjectItem> {
  return post<ProjectItem>('/projects', input);
}

/* ----------------------------- 数据血缘（P2，OpenMetadata） ----------------------------- */

export interface LineageEntity {
  fqn: string;
  name: string;
  entityType: string;
  displayName: string;
}

export interface LineageNode {
  id: string;
  label: string;
  entityType: string;
  fqn: string;
  deleted: boolean;
}

export interface LineageEdge {
  source: string;
  target: string;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  entityType: string;
  fqn: string;
}

export interface TableColumn {
  name: string;
  dataType: string;
  description: string;
  tags: string[];
}

export interface TableDetail {
  name: string;
  displayName: string;
  fqn: string;
  entityType: string;
  description: string;
  database: string;
  owner: string;
  updatedAt: number;
  updatedBy: string;
  columns: TableColumn[];
}

export async function getLineageHealth(): Promise<{ connected: boolean; version: string; baseUrl: string }> {
  return get<{ connected: boolean; version: string; baseUrl: string }>('/lineage/health');
}

export async function searchLineage(q: string, size = 20): Promise<LineageEntity[]> {
  return get<LineageEntity[]>(`/lineage/search?q=${encodeURIComponent(q)}&size=${size}`);
}

export async function getLineage(
  entityType: string,
  fqn: string,
  upstreamDepth = 1,
  downstreamDepth = 1,
): Promise<LineageGraph> {
  const params = new URLSearchParams({ upstreamDepth: String(upstreamDepth), downstreamDepth: String(downstreamDepth) });
  return get<LineageGraph>(`/lineage/${encodeURIComponent(entityType)}/name/${encodeURIComponent(fqn)}?${params}`);
}

export async function getTableDetail(fqn: string): Promise<TableDetail> {
  return get<TableDetail>(`/lineage/table/detail/${encodeURIComponent(fqn)}`);
}

/* --------------------------- 离线调度（P3，DolphinScheduler） --------------------------- */

export interface DsProject {
  id: number;
  name: string;
  description?: string;
  [k: string]: unknown;
}

export interface DsWorkflow {
  id: number;
  name: string;
  description?: string;
  releaseState?: string; // ONLINE / OFFLINE
  processDefinitionJson?: string;
  [k: string]: unknown;
}

export async function getDsProjects(): Promise<DsProject[]> {
  return get<DsProject[]>('/scheduler/projects');
}

export async function getDsWorkflows(projectName: string): Promise<DsWorkflow[]> {
  return get<DsWorkflow[]>(`/scheduler/projects/${encodeURIComponent(projectName)}/workflows`);
}

export async function getDsWorkflow(projectName: string, processId: number): Promise<DsWorkflow> {
  return get<DsWorkflow>(`/scheduler/projects/${encodeURIComponent(projectName)}/workflows/${processId}`);
}

export async function releaseDsWorkflow(projectName: string, processId: number, online: boolean): Promise<unknown> {
  return post(`/scheduler/projects/${encodeURIComponent(projectName)}/workflows/${processId}/release?online=${online}`);
}

export async function triggerDsWorkflow(projectName: string, processId: number): Promise<unknown> {
  return post(`/scheduler/projects/${encodeURIComponent(projectName)}/workflows/${processId}/trigger`);
}

export async function getDsInstances(projectName: string, pageNo = 1, pageSize = 20): Promise<unknown> {
  return get<unknown>(`/scheduler/projects/${encodeURIComponent(projectName)}/instances?pageNo=${pageNo}&pageSize=${pageSize}`);
}

/* --------------------------- 实时开发（P5，StreamPark，只读） --------------------------- */

export interface SpTaskStats {
  total: number;
  created: number;
  scheduled: number;
  deploying: number;
  running: number;
  finished: number;
  canceling: number;
  canceled: number;
  failed: number;
  reconciling: number;
}

export interface SpDashboard {
  runningJob: number;
  totalSlot: number;
  availableSlot: number;
  totalTM: number;
  tmMemory: number;
  jmMemory: number;
  task: SpTaskStats;
}

export interface SpProject {
  id: string;
  name: string;
  url?: string;
  branches?: string;
  buildState?: number;
  type?: number;
  description?: string;
  [k: string]: unknown;
}

export interface SpEnv {
  id: string;
  flinkName: string;
  version: string;
  scalaVersion: string;
  isDefault?: boolean;
  [k: string]: unknown;
}

export async function getSpDashboard(): Promise<SpDashboard> {
  return get<SpDashboard>('/streampark/dashboard');
}
export async function getSpProjects(): Promise<SpProject[]> {
  return get<SpProject[]>('/streampark/projects');
}
export async function getSpEnvs(): Promise<SpEnv[]> {
  return get<SpEnv[]>('/streampark/envs');
}
export async function getSpClusters(): Promise<unknown> {
  return get<unknown>('/streampark/clusters');
}
