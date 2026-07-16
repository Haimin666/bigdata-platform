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
