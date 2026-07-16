'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWorkspaces } from './api';

const WORKSPACE_ID_KEY = 'currentWorkspaceId';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  });
}

export function getCurrentWorkspaceId(): number | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(WORKSPACE_ID_KEY);
  return v ? Number(v) : null;
}

export function setCurrentWorkspaceId(id: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WORKSPACE_ID_KEY, String(id));
}
