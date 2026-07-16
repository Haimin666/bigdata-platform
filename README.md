# BigData Platform

现代化大数据开发平台 — Next.js 前端 + Spring Boot 平台服务层 + 内置统一网关，以 Apache Linkis 为计算脊梁，集成 DolphinScheduler / StreamPark / SeaTunnel / OpenMetadata 等开源组件（规划中）。

> 当前阶段：**P1 地基**（登录/JWT、工程管理、工作空间、RBAC、内置网关反代 Linkis、前端门户+IDE+画布 mock 可跑）。

## 目录结构

```
bigdata-platform/
├── web/                     # 前端：Next.js 15 + React 19 + TS + Tailwind v4
│   ├── src/
│   │   ├── app/[locale]/    #   路由：login / workspaceHome / projects / scriptis / workflow / apps / datasource / governance
│   │   ├── features/        #   workspace / projects / scriptis / workflow / apps / orchestrator / data
│   │   ├── components/      #   shell(Header/Sidebar/...) + ui
│   │   └── lib/             #   api / platform / auth / mock / types / apiPaths
│   ├── messages/            #   中英 i18n
│   └── Dockerfile
├── platform-service/        # 后端：Spring Boot 3 + JDK21 + JPA + Security + JWT
│   ├── src/main/java/com/dataplatform/platform/
│   │   ├── auth/            #   用户/JWT/登录
│   │   ├── workspace/       #   工作空间
│   │   ├── project/         #   工程 CRUD
│   │   ├── gateway/         #   内置网关：/api/linkis/** 反代 Linkis（含 mock）
│   │   ├── security/ config/ common/ seed/
│   ├── pom.xml
│   ├── settings.xml         #   阿里云 Maven 镜像
│   └── Dockerfile
├── docker-compose.yml       # mysql + platform-service + web 三件套
└── .env.example
```

## 技术栈

- **前端**：Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · next-intl v4 · TanStack Query · axios · CodeMirror · @xyflow/react · sonner · pnpm
- **后端**：Spring Boot 3.3 · JDK 21 · Spring Security (JWT) · Spring Data JPA · MySQL · jjwt
- **网关**：平台服务内置反代（`/api/platform/**` 平台自身、`/api/linkis/**` 转发 Linkis）
- **计算脊梁**：Apache Linkis（P1 用 mock，后续接真 Linkis）

## 快速开始

```bash
cd /Users/lbc/Public/www/bigdata-platform
cp .env.example .env          # 按需修改
docker compose up -d --build  # 首次构建（Maven/npm 已配国内镜像）
```

启动后：
- 前端：http://localhost:3000 （登录 admin / admin123）
- 平台服务：http://localhost:8088
- 默认 `LINKIS_MOCK=true`，无需真 Linkis 即可跑通「登录→建工程→跑 SQL(mock)」链路

### 接真 Linkis
在 `.env` 设 `LINKIS_MOCK=false`、`LINKIS_BASE_URL=http://<linkis网关>:9001`，重启 platform-service。
注意：Linkis 的 SSO/鉴权对接是后续工作（P1 网关仅透传，未做 Linkis token 桥接）。

## 本地开发（非 Docker）

```bash
# 前端
cd web && pnpm install
NEXT_PUBLIC_USE_PLATFORM=true NEXT_PUBLIC_PLATFORM_API=http://localhost:8088 pnpm dev

# 后端（需本地 MySQL，或连 docker compose 起的 mysql）
cd platform-service && mvn spring-boot:run
```

## 接口契约

| 路径 | 归属 | 说明 |
|---|---|---|
| `POST /api/platform/auth/login` | 平台 | 登录，返回 JWT |
| `GET /api/platform/auth/me` | 平台 | 当前用户 |
| `GET /api/platform/workspaces` | 平台 | 工作空间列表 |
| `GET/POST /api/platform/projects` | 平台 | 工程 CRUD |
| `/api/linkis/**` | 网关→Linkis | 计算/文件/作业历史（mock 或真 Linkis） |

统一响应信封：`{ status: 0, message: "ok", data: ... }`（status=0 成功），与 Linkis 风格一致。

## 路线图

- ✅ **P1 地基**：平台服务 + 网关 + 前端门户/IDE/画布（mock）
- ⬜ **P2 元数据血缘**：接 Apache OpenMetadata，统一血缘视图 + 跳转任务
- ⬜ **P3 离线调度**：接 DolphinScheduler，画布→DS 工作流转化
- ⬜ **P4 数据同步**：接 SeaTunnel，同步任务配置 UI
- ⬜ **P5 实时开发**：接 StreamPark，Flink SQL 开发上线
- ⬜ **P6 数据接口**：SQL→REST 快捷发布
- ⬜ Linkis SSO 桥接、RBAC 细化、YARN/HDFS 监控页

## 说明

本项目从 DataSphereStudio 重构迁移而来，仅保留自研的前端与平台服务层，不包含原 DSS 的 Vue2 前端与 Java 微服务。原仓库 `/Users/lbc/Public/www/DataSphereStudio` 中的 `web-nextjs/`、`platform-service/` 仍保留作为参考。
