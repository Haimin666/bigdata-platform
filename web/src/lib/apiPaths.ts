// 保留的 Linkis / 数据源 / 数据治理 路径常量（DSS 框架路径随 workspace/project 模块移除）
export const API_PATHS = {
  DATASOURCE: '/dss/data/api/datasource/',
  DATA_GOVERNANCE: '/dss/data/governance/asset/',
  // Linkis 文件系统与执行入口
  FILESYSTEM: '/filesystem/',
  ENTRANCE: '/entrance/',
} as const;
