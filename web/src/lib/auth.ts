'use client';

import JSEncrypt from 'jsencrypt';
import { api } from './api';
import { API_PATHS } from './apiPaths';
import { enableDemoMode, disableDemoMode } from './mock';
import { platformMode, platformLogin, clearToken } from './platform';
import type {
  BaseInfo,
  LoginResult,
  PublicKeyData,
  WorkspaceHomePage,
} from './types';

const BASE_INFO_KEY = 'baseInfo';
const LOCALE_KEY = 'locale';

export function getBaseInfo(): BaseInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(BASE_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BaseInfo;
  } catch {
    return null;
  }
}

export function setBaseInfo(info: BaseInfo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BASE_INFO_KEY, JSON.stringify(info));
}

export function clearBaseInfo(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(BASE_INFO_KEY);
}

export function setLocale(locale: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_KEY, locale);
}

export async function getPublicKey(): Promise<PublicKeyData | null> {
  try {
    return await api.fetch<PublicKeyData>('/user/publicKey', { method: 'get' });
  } catch {
    return null;
  }
}

export async function login(
  userName: string,
  password: string,
): Promise<LoginResult> {
  // 平台模式：走 Spring Boot 平台服务（JWT）
  if (platformMode()) {
    const r = await platformLogin(userName, password);
    setBaseInfo({ username: r.username, isAdmin: r.isAdmin });
    return {};
  }
  const pk = await getPublicKey();
  let payloadPassword = password;
  if (pk?.enableLoginEncrypt && pk.publicKey) {
    const key = `-----BEGIN PUBLIC KEY-----${pk.publicKey}-----END PUBLIC KEY-----`;
    const enc = new JSEncrypt({});
    enc.setPublicKey(key);
    const encPwd = enc.encrypt(password);
    if (encPwd) payloadPassword = encPwd;
  }
  const rst = await api.fetch<LoginResult>('/user/login', {
    userName,
    password: payloadPassword,
  });
  setBaseInfo({ username: userName });
  return rst ?? {};
}

// 演示模式：跳过后端登录，直接进入应用（假数据）
export async function demoLogin(): Promise<void> {
  enableDemoMode();
  setBaseInfo({ username: 'demo', isAdmin: false });
}

export async function fetchIsAdmin(): Promise<boolean> {
  try {
    const res = await api.fetch<{ admin: boolean }>(
      '/jobhistory/governanceStationAdmin',
      { method: 'get' },
    );
    return !!res?.admin;
  } catch {
    return false;
  }
}

export async function getWorkspaceHomePage(): Promise<WorkspaceHomePage> {
  return api.fetch<WorkspaceHomePage>(`${API_PATHS.WORKSPACE}getWorkspaceHomePage`, {
    method: 'get',
    params: { micro_module: 'dss' },
  });
}

export async function logout(): Promise<void> {
  if (platformMode()) {
    clearToken();
    clearBaseInfo();
    return;
  }
  try {
    await api.fetch('/user/logout', { method: 'post' });
  } catch {
    /* ignore */
  }
  disableDemoMode();
  clearBaseInfo();
}
