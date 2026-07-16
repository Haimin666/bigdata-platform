// 与 web/ 的 shared/common/config/apiPath.js 保持一致的后端路径常量
export const API_PATHS = {
  WORKSPACE: '/dss/framework/workspace/',
  WORKSPACE_FRAMEWORK: '/dss/framework/',
  PROJECT: '/dss/framework/project/',
  ORCHESTRATOR: '/dss/framework/orchestrator/',
  WORKFLOW: '/dss/workflow/',
  PUBLISH: '/dss/framework/release/',
  DATASOURCE: '/dss/data/api/datasource/',
  DATA_GOVERNANCE: '/dss/data/governance/asset/',
  // Linkis 文件系统与执行入口（原版 web/ 真实使用）
  FILESYSTEM: '/filesystem/',
  ENTRANCE: '/entrance/',
} as const;
