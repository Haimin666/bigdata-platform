import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';
import { isDemoMode, mockFetch } from './mock';
import { platformMode, platformApiBase, getToken } from './platform';

// 平台模式：计算请求经平台服务内置网关 /api/linkis/** 转发到 Linkis
const baseURL = platformMode()
  ? `${platformApiBase()}/api/linkis/`
  : process.env.NEXT_PUBLIC_API_BASE || '/api/rest_j/v1/';

const instance: AxiosInstance = axios.create({
  baseURL,
  timeout: 600000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
});

instance.interceptors.request.use((config) => {
  if (typeof localStorage !== 'undefined') {
    config.headers['Content-language'] = localStorage.getItem('locale') || 'zh-CN';
    if (platformMode()) {
      const t = getToken();
      if (t) config.headers.Authorization = `Bearer ${t}`;
    }
  }
  return config;
});

function toError(error: AxiosError<any>): Error {
  const data = error.response?.data;
  const msg =
    (data && typeof data === 'object' && (data as any).message) ||
    error.message ||
    '请求失败';
  return new Error(typeof msg === 'string' ? msg : '请求失败');
}

instance.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'status' in payload) {
      if (payload.status !== 0) {
        const msg = payload.message || '请求失败';
        if (typeof window !== 'undefined') toast.error(msg);
        return Promise.reject(new Error(msg));
      }
      return { ...response, data: (payload as any).data ?? payload };
    }
    return response;
  },
  (error) => {
    const err = toError(error);
    if (typeof window !== 'undefined') {
      toast.error(err.message);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export interface FetchOptions {
  method?: 'get' | 'post' | 'put' | 'delete';
  params?: Record<string, unknown>;
  data?: unknown;
}

function normalize(
  url: string,
  optsOrParams?: FetchOptions | object,
  method?: string,
): { config: AxiosRequestConfig } {
  let opts: FetchOptions;
  if (method) {
    const m = method.toLowerCase();
    opts = { method: m as FetchOptions['method'] } as FetchOptions;
    if (m === 'get') opts.params = optsOrParams as Record<string, unknown>;
    else opts.data = optsOrParams;
  } else if (
    optsOrParams &&
    typeof optsOrParams === 'object' &&
    ('method' in optsOrParams || 'data' in optsOrParams || 'params' in optsOrParams)
  ) {
    opts = { method: 'get', ...(optsOrParams as FetchOptions) };
  } else {
    opts = { method: 'post', data: optsOrParams };
  }
  const config: AxiosRequestConfig = {
    url,
    method: opts.method || 'get',
  };
  if (opts.params) config.params = opts.params;
  if (opts.data !== undefined) config.data = opts.data;
  return { config };
}

export const api = {
  instance,
  fetch<T = unknown>(
    url: string,
    optsOrParams?: FetchOptions | object,
    method?: string,
  ): Promise<T> {
    const { config } = normalize(url, optsOrParams, method);
    // 演示模式（非平台模式）：不请求后端，直接返回假数据
    if (!platformMode() && isDemoMode()) {
      return mockFetch<T>(url, config.data ?? config.params);
    }
    return instance.request(config).then((res) => res.data as T);
  },
};
