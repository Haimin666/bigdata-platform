# CLAUDE.md — BigData Platform

> 给 Claude Code 的项目指南。先读这份，再动代码。

## 项目是什么

现代化大数据开发平台。**Next.js 前端 + Spring Boot 平台服务层 + 内置统一网关**，以 Apache Linkis 为计算脊梁，规划集成 DolphinScheduler（离线调度）/ StreamPark（实时）/ SeaTunnel（同步）/ OpenMetadata（元数据血缘）。

当前阶段：**P1 地基已完成**（登录/JWT、工程/工作空间 CRUD、RBAC、内置网关反代 Linkis、前端门户+IDE+画布 mock 可跑）。P2~P6 未开始。

## 仓库布局

```
bigdata-platform/
├── web/                     # 前端 Next.js 15
│   ├── src/app/[locale]/    #   路由（App Router + next-intl，localePrefix always）
│   ├── src/features/        #   workspace / projects / scriptis / workflow / apps / orchestrator / data
│   ├── src/components/      #   shell(Header/Sidebar/AppShell/...) + ui(Button/Card/Input/...)
│   ├── src/lib/             #   api.ts / platform.ts / auth.ts / mock.ts / apiPaths.ts / types.ts
│   └── messages/            #   zh-CN.json / en.json
├── platform-service/        # 后端 Spring Boot 3
│   └── src/main/java/com/dataplatform/platform/{auth,workspace,project,gateway,security,config,common,seed}
├── docker-compose.yml       # mysql + platform-service + web
└── .env.example
```

## 技术栈

- **前端**：Next.js 15.1 App Router · React 19 · TypeScript strict · Tailwind v4 · next-intl v4 · TanStack Query · axios · CodeMirror（SQL IDE）· @xyflow/react（工作流画布）· sonner · pnpm 11.5
- **后端**：Spring Boot 3.3 · JDK 21 · Spring Security (JWT, jjwt 0.12) · Spring Data JPA · MySQL 8 · Maven
- **网关**：平台服务内置反代（`/api/platform/**` 平台自身、`/api/linkis/**` 转发 Linkis）
- **设计风格**：Console Noir（暗色优先 + 琥珀点缀），亮/暗双主题，IBM Plex 字体

## 运行

### Docker（推荐，一键起整套）
```bash
cd /Users/lbc/Public/www/bigdata-platform
cp .env.example .env
docker compose up -d --build
# 前端 http://localhost:3000  登录 admin/admin123
# 平台服务 http://localhost:8088
# 默认 LINKIS_MOCK=true，无需真 Linkis 即可跑通「登录→建工程→跑SQL(mock)」
```

### 本地开发
```bash
# 前端
cd web && pnpm install
NEXT_PUBLIC_USE_PLATFORM=true NEXT_PUBLIC_PLATFORM_API=http://localhost:8088 pnpm dev
# 前端单测/构建
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm build       # next build

# 后端（连 docker compose 的 mysql，或本地 mysql）
cd platform-service && mvn spring-boot:run
```

## 关键架构（务必理解）

### 双模式开关（前端）
`web/src/lib/platform.ts` 的 `platformMode()` = `NEXT_PUBLIC_USE_PLATFORM==='true' && !!NEXT_PUBLIC_PLATFORM_API`。
- **平台模式**：auth/workspace/projects 走 `platform.ts`（Spring Boot）；计算（api.ts）走 `${PLATFORM_API}/api/linkis/` 经网关。
- **非平台模式**：走 `api.ts` 直连 `/api/rest_j/v1/`（DSS/Linkis 风格），`isDemoMode()` 时短路到 `mock.ts`。
- 改动 auth/workspace/projects/api 时，**两条分支都要维护**。

### 响应信封
统一 `{ status, message, data }`，**status=0 成功**（与 Linkis 一致）。前端 `api.ts` 和 `platform.ts` 的响应拦截器都按此解包。后端用 `common/ApiResponse`。

### 内置网关
`platform-service/.../gateway/LinkisProxyController`：`/api/linkis/**` → `${linkis.base-url}/api/rest_j/v1/**`。
- `LINKIS_MOCK=true` 时不转发，返回同构 mock 响应（脚本/执行结果/作业历史）。
- `LINKIS_MOCK=false` 时用 RestClient 转发真 Linkis。**注意：P1 未做 Linkis token/SSO 桥接，仅透传，接真 Linkis 时鉴权要单独处理。**

### 认证
JWT（`Authorization: Bearer <token>`）。`security/JwtAuthFilter` 解析，`SecurityConfig` 放行 `/api/platform/auth/login`，其余需认证。种子账号 admin/admin123（`seed/DataInitializer`）。

## 约定

### 前端
- 文件组织按 feature，不用按类型堆目录。组件 PascalCase，hooks 用 `use` 前缀，CSS 变量走 `globals.css` 的 `--color-*`/`--radius`。
- 新接口路径常量加到 `lib/apiPaths.ts`（保持与 Linkis/DSS 真实路径一致，不要编造）。
- i18n：所有可见文案进 `messages/*.json`，用 `useTranslations`。中英都要加。
- mock 数据集中在 `lib/mock.ts`，`mockFetch(url, payload)` 按 url+payload 分支。
- 工作流节点类型经 `features/workflow/nodes/FlowNode.tsx`，画布用 `@xyflow/react`（节点 data 必须带 index signature 满足 `Record<string,unknown>`）。
- UI 风格遵循 `globals.css` 的 Console Noir 令牌；不要硬编码颜色。

### 后端
- 包结构：`auth/workspace/project/gateway/security/config/common/seed`，按域分。
- 实体用 JPA，`ddl-auto=update`，新表自动建。种子数据进 `seed/DataInitializer`。
- Controller 返回 `ApiResponse.ok(data)`；业务异常抛 `BizException`，`GlobalExceptionHandler` 兜底。
- DTO 用 record + `@Valid` 校验。

## 坑（踩过的）

- **`NEXT_PUBLIC_*` 是构建时变量**：必须通过 Dockerfile `ARG` + compose `build.args` 注入，运行时 env 不生效。已配好，别回退。
- **pnpm 11.5**：`pnpm-workspace.yaml` 用 `allowBuilds:` map（非 `onlyBuiltDependencies`）；`.npmrc` 有 `verify-deps-before-run=false`。新加带 native build 的依赖要更新 `allowBuilds`。
- **国内镜像源**：Maven 用 `platform-service/settings.xml`（阿里云，Dockerfile 已 COPY）；npm 用 `web/.npmrc`（npmmirror）。Docker 守护进程镜像源在宿主 Docker Desktop 配置。
- **xyflow v12 类型**：`useNodesState<Node<Data>>`，`NodeProps<Node<Data>>`，Data 接口要 index signature。
- **Linkis 版本**：若后续接真 Linkis，DSS 用的 `1.14.2-wds` 是微众定制版，与本平台无关；本平台应接**社区原版 Apache Linkis**。
- **本仓库有 Fact-Forcing Gate hook**：Write 新文件 / Edit 前会被要求陈述事实（导入方、受影响、数据字段、用户原话）。照做即可，陈述后重试同一操作。

## 路线图

- ✅ P1 地基：平台服务 + 网关 + 前端门户/IDE/画布（mock）
- ⬜ P2 元数据血缘：接 Apache OpenMetadata，统一血缘视图 + 从表跳转产出任务
- ⬜ P3 离线调度：接 DolphinScheduler，工作流画布 → DS DAG 转化层
- ⬜ P4 数据同步：接 SeaTunnel，同步任务配置 UI
- ⬜ P5 实时开发：接 StreamPark，Flink SQL 开发/上线
- ⬜ P6 数据接口：SQL→REST 快捷发布
- ⬜ Linkis SSO/token 桥接、RBAC 细化、YARN/HDFS 监控页

## 重要边界

- **不要碰** `/Users/lbc/Public/www/DataSphereStudio`（原 DSS 参考仓库，仅作参考）。所有开发在 `bigdata-platform/`。
- 真实大数据组件（Linkis/DS/SeaTunnel/StreamPark/OpenMetadata）是**独立部署的外部系统**，本平台通过 REST/网关对接，不在本仓库内实现它们。
- 提交前跑 `pnpm typecheck && pnpm test && pnpm build`（前端）和 `mvn package`（后端）确保绿。
