import { API_PATHS } from './apiPaths';
import type {
  AppConnItem,
  DataAssetItem,
  DataSourceItem,
  OrchestratorItem,
  ProjectItem,
  RunResult,
  ScriptItem,
  WorkspaceItem,
} from './types';

const MOCK_LATENCY = 200;

const mockWorkspaces: WorkspaceItem[] = [
  { id: 1, name: '演示工作空间', description: 'DSS 演示工作空间（假数据）', isDefaultWorkspace: true },
  { id: 2, name: '数据开发空间', description: '日常数据开发与加工', isDefaultWorkspace: false },
  { id: 3, name: '算法实验空间', description: '机器学习与算法实验', isDefaultWorkspace: false },
];

const mockProjects: ProjectItem[] = [
  { id: 101, name: 'demo_project', description: '示例工程：含若干脚本与工作流，用于快速了解 DSS 编排能力', applicationArea: '基础科技', product: 'DSS', createBy: 'hadoop', createTime: '2025-03-12 10:24', visibility: '公开', orchestratorCount: 3, business: '示例' },
  { id: 102, name: 'etl_pipeline', description: 'ETL 数据加工流水线：采集→清洗→落库全链路编排', applicationArea: '基础科技', product: 'DSS', createBy: 'hadoop', createTime: '2025-03-18 09:11', visibility: '公开', orchestratorCount: 5, business: '数据平台' },
  { id: 103, name: 'ml_experiment', description: '机器学习实验工程：特征工程、训练、评估编排', applicationArea: '算法', product: 'DSS', createBy: 'alice', createTime: '2025-04-02 14:50', visibility: '团队', orchestratorCount: 4, business: '算法' },
  { id: 104, name: 'risk_report', description: '风控报表与指标工程：T+1 指标计算与报表生成', applicationArea: '风控', product: 'DSS', createBy: 'bob', createTime: '2025-04-15 16:32', visibility: '公开', orchestratorCount: 6, business: '风控' },
  { id: 105, name: 'realtime_dashboard', description: '实时大盘：流式指标计算与可视化推送', applicationArea: '基础科技', product: 'DSS', createBy: 'hadoop', createTime: '2025-05-08 11:05', visibility: '团队', orchestratorCount: 2, business: '数据平台' },
  { id: 106, name: 'user_labels', description: '用户标签体系：标签加工与人群圈选编排', applicationArea: '算法', product: 'DSS', createBy: 'alice', createTime: '2025-05-21 18:44', visibility: '公开', orchestratorCount: 3, business: '增长' },
  { id: 107, name: 'data_quality', description: '数据质量监控：规则校验与告警上报', applicationArea: '风控', product: 'DSS', createBy: 'bob', createTime: '2025-06-03 09:30', visibility: '公开', orchestratorCount: 4, business: '治理' },
  { id: 108, name: 'ad_hoc', description: '临时分析工程：即席查询与导出', applicationArea: '基础科技', product: 'DSS', createBy: 'hadoop', createTime: '2025-06-19 13:20', visibility: '公开', orchestratorCount: 1, business: '分析' },
];

// 编排（工作流）假数据：按 projectId 索引；缺失时回退到默认集合
const orchestratorTemplates: Array<Omit<OrchestratorItem, 'orchestratorId' | 'orchestratorName'>> = [
  { description: '主数据加工编排', status: 'published', type: 'workflow', createBy: 'hadoop', createTime: '2025-03-12 11:00', orchestratorVersionId: 3 },
  { description: '调度补数编排', status: 'developing', type: 'workflow', createBy: 'hadoop', createTime: '2025-04-01 10:10', orchestratorVersionId: 1 },
  { description: '指标汇总编排', status: 'published', type: 'workflow', createBy: 'alice', createTime: '2025-04-20 15:22', orchestratorVersionId: 2 },
  { description: '质量校验编排', status: 'disabled', type: 'workflow', createBy: 'bob', createTime: '2025-05-12 09:45', orchestratorVersionId: 1 },
  { description: '实验训练编排', status: 'developing', type: 'workflow', createBy: 'alice', createTime: '2025-06-01 17:30', orchestratorVersionId: 1 },
  { description: '报表生成编排', status: 'published', type: 'workflow', createBy: 'bob', createTime: '2025-06-10 14:00', orchestratorVersionId: 4 },
];

const orchestratorByProject: Record<number, OrchestratorItem[]> = {};
for (const p of mockProjects) {
  const count = p.orchestratorCount ?? 2;
  const items: OrchestratorItem[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = orchestratorTemplates[i % orchestratorTemplates.length];
    items.push({
      ...tpl,
      orchestratorId: p.id * 100 + i + 1,
      orchestratorName: `${p.name}_flow_${String(i + 1).padStart(2, '0')}`,
    });
  }
  orchestratorByProject[p.id] = items;
}

// 脚本（Scriptis）假数据
const mockScripts: ScriptItem[] = [
  { id: 's1', name: 'user_stats.sql', type: 'spark.sql', updateBy: 'hadoop', updateTime: '2025-06-20 14:10', content: '-- 用户统计\nSELECT\n  dt,\n  COUNT(DISTINCT user_id) AS uv,\n  COUNT(*) AS pv\nFROM dss_demo.user_access_log\nWHERE dt >= "${run_dt}"\nGROUP BY dt\nORDER BY dt DESC\nLIMIT 100;' },
  { id: 's2', name: 'etl_orders.sql', type: 'hive.sql', updateBy: 'hadoop', updateTime: '2025-06-18 09:30', content: '-- 订单清洗\nINSERT OVERWRITE TABLE dss_demo.dwd_orders\nSELECT order_id, user_id, amount, status, dt\nFROM ods.ods_orders\nWHERE dt = "${run_dt}" AND status IS NOT NULL;' },
  { id: 's3', name: 'feature_build.py', type: 'python', updateBy: 'alice', updateTime: '2025-06-15 17:22', content: '# 特征加工\nimport pandas as pd\n\nprint("building features...")\ndf = pd.DataFrame({"user_id": [1,2,3], "score": [0.8,0.5,0.9]})\nprint(df.describe())' },
  { id: 's4', name: 'export_data.sh', type: 'shell', updateBy: 'bob', updateTime: '2025-06-10 11:05', content: '#!/bin/bash\n# 导出结果到 HDFS\necho "exporting..."\nhdfs dfs -put /tmp/result.csv /data/export/' },
];

// 执行结果假数据（确定性，按脚本类型微调）
function mockRunResult(script: ScriptItem | undefined): RunResult {
  if (script?.type === 'python') {
    return {
      taskId: 'task_py_' + (script?.id ?? 'x'),
      status: 'success',
      columns: [{ name: 'log' }],
      rows: [['building features...'], ['user_id  score'], ['count  3.0'], ['mean   0.7333']],
      durationMs: 1830,
      log: ['> python feature_build.py', 'building features...', 'count  3.000000', 'mean   0.733333', '任务执行成功'],
    };
  }
  if (script?.type === 'shell') {
    return {
      taskId: 'task_sh_' + (script?.id ?? 'x'),
      status: 'success',
      columns: [{ name: 'output' }],
      rows: [['exporting...'], ['uploaded to /data/export/result.csv']],
      durationMs: 642,
      log: ['> bash export_data.sh', 'exporting...', 'uploaded to /data/export/result.csv', '任务执行成功'],
    };
  }
  return {
    taskId: 'task_sql_' + (script?.id ?? 'x'),
    status: 'success',
    columns: [
      { name: 'dt', type: 'string' },
      { name: 'uv', type: 'bigint' },
      { name: 'pv', type: 'bigint' },
    ],
    rows: [
      ['2025-06-20', 128034, 490122],
      ['2025-06-19', 125871, 482310],
      ['2025-06-18', 124002, 475988],
      ['2025-06-17', 121560, 468021],
      ['2025-06-16', 119884, 461540],
    ],
    durationMs: 3210,
    log: [
      '> submit to linkis spark engine',
      'driver started on yarn',
      'query progress: 100%',
      'fetched 5 rows',
      '任务执行成功',
    ],
  };
}

// 数据源假数据
const mockDataSources: DataSourceItem[] = [
  { id: 1, name: 'prod_hive', type: 'hive', host: 'hadoop-prod-01', port: 10000, database: 'dss_demo', status: 'connected', createBy: 'hadoop' },
  { id: 2, name: 'olap_mysql', type: 'mysql', host: 'mysql-olap-02', port: 3306, database: 'report', status: 'connected', createBy: 'bob' },
  { id: 3, name: 'feature_store', type: 'mysql', host: 'mysql-feat-03', port: 3306, database: 'feature', status: 'offline', createBy: 'alice' },
  { id: 4, name: 'kafka_stream', type: 'kafka', host: 'kafka-broker-01', port: 9092, status: 'connected', createBy: 'hadoop' },
];

// 数据资产假数据
const mockDataAssets: DataAssetItem[] = [
  { id: 1, name: 'user_access_log', type: 'table', database: 'dss_demo', comment: '用户访问日志明细', rowCount: 128030422, sizeMb: 8192, owner: 'hadoop', updateTime: '2025-06-20' },
  { id: 2, name: 'dwd_orders', type: 'table', database: 'dss_demo', comment: '订单明细宽表', rowCount: 9042211, sizeMb: 2048, owner: 'hadoop', updateTime: '2025-06-19' },
  { id: 3, name: 'user_labels', type: 'table', database: 'dss_demo', comment: '用户标签表', rowCount: 3200122, sizeMb: 1024, owner: 'alice', updateTime: '2025-06-15' },
  { id: 4, name: 'risk_metrics', type: 'view', database: 'dss_demo', comment: '风控指标视图', owner: 'bob', updateTime: '2025-06-12' },
  { id: 5, name: 'dss_demo', type: 'database', database: 'dss_demo', comment: '演示库', owner: 'hadoop', updateTime: '2025-03-12' },
];

// AppConn 子应用清单（前端静态，非后端接口）
export const mockAppConns: AppConnItem[] = [
  { key: 'scriptis', name: 'Scriptis', description: 'SQL/脚本在线开发 IDE，支持 Spark/Hive/Python/Shell', category: 'develop', status: 'online' },
  { key: 'visualis', name: 'Visualis', description: '数据可视化与仪表盘，图表与展示组件', category: 'visual', status: 'online' },
  { key: 'schedulis', name: 'Schedulis', description: '基于 Azkaban 的工作流调度系统', category: 'schedule', status: 'online' },
  { key: 'qualitis', name: 'Qualitis', description: '数据质量管理，规则校验与监控告警', category: 'quality', status: 'online' },
  { key: 'exchangis', name: 'Exchangis', description: '数据交换平台，异构数据源同步', category: 'exchange', status: 'offline' },
  { key: 'streamis', name: 'Streamis', description: '流式应用开发与监控管理', category: 'stream', status: 'soon' },
  { key: 'prophecis', name: 'Prophecis', description: '机器学习实验与模型管理', category: 'ml', status: 'soon' },
  { key: 'dolphinscheduler', name: 'DolphinScheduler', description: '分布式可视化 DAG 调度任务', category: 'schedule', status: 'offline' },
  { key: 'airflow', name: 'Airflow', description: 'Airflow 调度集成', category: 'schedule', status: 'soon' },
];

export const DEMO_FLAG = 'dss_demo';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEMO_FLAG) === '1';
}

export function enableDemoMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_FLAG, '1');
}

export function disableDemoMode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_FLAG);
}

function projectIdFromPayload(payload: unknown): number | undefined {
  if (payload && typeof payload === 'object') {
    const v = (payload as Record<string, unknown>).projectId;
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '') return Number(v);
  }
  return undefined;
}

export function mockFetch<T = unknown>(url: string, payload?: unknown): Promise<T> {
  let data: unknown = {};
  if (url === '/user/publicKey') data = { enableLoginEncrypt: false, publicKey: '' };
  else if (url === '/user/login') data = {};
  else if (url === '/jobhistory/governanceStationAdmin') data = { admin: false };
  else if (url === `${API_PATHS.WORKSPACE}getWorkspaceHomePage`)
    data = { workspaceHomePage: { homePageUrl: '/workspaceHome' } };
  else if (url === `${API_PATHS.WORKSPACE}workspaces`) data = { workspaces: mockWorkspaces };
  else if (url === `${API_PATHS.PROJECT}getAllProjects`) data = { projects: mockProjects };
  else if (url === `${API_PATHS.PROJECT}createProject`) data = { id: 200 };
  else if (url === `${API_PATHS.PROJECT}listApplicationAreas`)
    data = { applicationAreas: ['基础科技', '算法', '风控', '治理', '增长'] };
  else if (url === `${API_PATHS.ORCHESTRATOR}getAllOrchestrator`) {
    const pid = projectIdFromPayload(payload);
    const list = orchestratorByProject[pid ?? 101] ?? [];
    data = { page: list, total: list.length };
  }
  // Scriptis：脚本列表/打开/保存
  else if (url === `${API_PATHS.FILESYSTEM}getDirFileTrees`) data = { files: mockScripts };
  else if (url === `${API_PATHS.FILESYSTEM}openFile`) {
    const name = stringField(payload, 'fileName') ?? stringField(payload, 'path');
    const found = mockScripts.find((s) => s.name === name || s.id === name);
    data = { script: found ?? mockScripts[0] };
  } else if (url === `${API_PATHS.FILESYSTEM}saveScript`) data = {};
  // Linkis 执行入口
  else if (url === `${API_PATHS.ENTRANCE}execute`) {
    const runType = stringField(payload, 'runType');
    const fake: ScriptItem | undefined =
      runType === 'python'
        ? mockScripts[2]
        : runType === 'sh'
          ? mockScripts[3]
          : mockScripts[0];
    data = mockRunResult(fake);
  }
  // 数据源 / 数据资产
  else if (url === `${API_PATHS.DATASOURCE}listDataSources`)
    data = { list: mockDataSources };
  else if (url === `${API_PATHS.DATA_GOVERNANCE}listAssets`)
    data = { assets: mockDataAssets };
  return new Promise((resolve) => setTimeout(() => resolve(data as T), MOCK_LATENCY));
}

function stringField(payload: unknown, key: string): string | undefined {
  if (payload && typeof payload === 'object') {
    const v = (payload as Record<string, unknown>)[key];
    if (typeof v === 'string') return v;
  }
  return undefined;
}
