import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/apiPaths';
import type { DataAssetItem, DataSourceItem } from '@/lib/types';

export async function fetchDataSources(): Promise<DataSourceItem[]> {
  const res = await api.fetch<{ list: DataSourceItem[] }>(
    `${API_PATHS.DATASOURCE}listDataSources`,
  );
  return res?.list ?? [];
}

export async function fetchDataAssets(): Promise<DataAssetItem[]> {
  const res = await api.fetch<{ assets: DataAssetItem[] }>(
    `${API_PATHS.DATA_GOVERNANCE}listAssets`,
  );
  return res?.assets ?? [];
}
