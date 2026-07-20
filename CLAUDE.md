# CLAUDE.md — BigData Platform

> 给 Claude Code 的项目指南。先读这份，再动代码。

## 项目是什么

现代化大数据开发平台。**Next.js 前端 + Spring Boot 平台服务层 + 内置统一网关**，以 Apache Linkis 为计算脊梁，集成 OpenMetadata（元数据血缘）/ DolphinScheduler（离线调度）/ StreamPark（实时）/ SeaTunnel（同步）。

当前阶段：**P1 地基 + P2 血缘 + P3 离线调度 + P5 实时 均已完成并真实联调通过**。P4（SeaTunnel）/ P6（SQL→REST）未开始。

## 仓库布局

```
bigdata-platform/
├── web/                     # 前端 Next.js 15
│   ├── src/app/[locale]/    #   路由（App Router + next-intl，localePrefix always）
│   │   ├── (app)/           #   scriptis / datasource / governance / lineage / scheduler / streampark
│   │   └── login/           #   登录页
│   ├── src/features/        #   scriptis / data / lineage / scheduler / streampark
│   ├── src/components/      #   shell(Header/Sidebar/AppShell/Footer/...) + ui(Button/Card/Input/Pagination/...)
│   ├── src/lib/             #   api.ts / platform.ts / auth.ts / mock.ts / apiPaths.ts / types.ts / cn.ts
│   └── messages/            #   zh-CN.json / en.json
├── platform-service/        # 后端 Spring Boot 3
│   └── src/main/java/com/dataplatform/platform/{auth,security,config,gateway,common,seed,lineage,scheduler,streampark}
├── docker-compose.yml       # mysql + platform-service + web
└── .env.example
```

> 已移除的 DSS 遗留模块：workspace / projects / apps / workflow / orchestrator（前后端均删）。platform-service 的 `platform_workspace` / `platform_project` 表是孤儿空表（JPA ddl-auto=update 不删表，无害）。

## 技术栈

- **前端**：Next.js 15.1 App Router · React 19 · TypeScript strict · Tailwind v4 · next-intl v4 · TanStack Query · axios · CodeMirror（SQL IDE）· @xyflow/react（血缘/调度 DAG 画布）· sonner · pnpm 11.5
- **后端**：Spring Boot 3.3 · JDK 21 · Spring Security (JWT, jjwt 0.12) · Spring Data JPA · MySQL 8 · Maven
- **网关**：平台服务内置反代（`/api/platform/**` 平台自身、`/api/linkis/**` 转发 Linkis）
- **设计风格**：Console Noir（暗色优先 + 琥珀点缀），亮/暗双主题，IBM Plex 字体

## 运行

### Docker（推荐，一键起整套）
```bash
cd /Users/lbc/Public/www/bigdata-platform
cp .env.example .env   # 填 OPENMETADATA_TOKEN / DOLPHINSCHEDULER_TOKEN / STREAMPARK_TOKEN
docker compose up -d --build
# 前端 http://localhost:3000  登录 admin/admin123，登录后跳 /lineage
# 平台服务 http://localhost:8088
# 默认 LINKIS_MOCK=true；OM/DS/SP 需各自 token 才能用对应模块，留空则该模块返回 503
```

### 本地开发
```bash
# 前端
cd web && pnpm install
NEXT_PUBLIC_USE_PLATFORM=true NEXT_PUBLIC_PLATFORM_API=http://localhost:8088 pnpm dev
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest run
pnpm build       # next build

# 后端（连 docker compose 的 mysql）
cd platform-service && mvn spring-boot:run
# 后端编译验证（无 mvn 时用 docker maven）
docker run --rm -v "$PWD":/build -w /build -v "$PWD/settings.xml":/root/.m2/settings.xml maven:3.9-eclipse-temurin-21 mvn -B -DskipTests compile
```

## 关键架构（务必理解）

### 双模式开关（前端）
`web/src/lib/platform.ts` 的 `platformMode()` = `NEXT_PUBLIC_USE_PLATFORM==='true' && !!NEXT_PUBLIC_PLATFORM_API`。
- **平台模式**：auth（`platform.ts`）+ 血缘/调度/实时（`platform.ts` 的 `/lineage` `/scheduler` `/streampark`）走 Spring Boot；Linkis 计算（`api.ts`）走 `${PLATFORM_API}/api/linkis/` 经网关。
- **非平台模式**：走 `api.ts` 直连 `/api/rest_j/v1/`（DSS/Linkis 风格），`isDemoMode()` 时短路到 `mock.ts`。
- Linkis 接口改动维护 `api.ts`；平台集成接口改动维护 `platform.ts`。

### 响应信封
- 平台统一 `{ status, message, data }`，**status=0 成功**（与 Linkis 一致）。前端 `platform.ts`/`api.ts` 拦截器按此解包。后端用 `common/ApiResponse`。
- **外部组件信封各异，适配器归一**：
  - OpenMetadata：无信封，HTTP 状态码；401→BizException(401)，404→404，不可达→502。
  - DolphinScheduler：`{code, msg, data}`，**code=0 成功**；`code=30002`→403（无项目权限），`10003`→401。
  - StreamPark：`{code, msg, data}`，**code=200 成功**（注意与 DS 的 0 不同！）。

### 统一分页（PageResult）
`common/PageResult<T>(records, total, page, pageSize, totalPage)` + 静态 `of()`（服务端分页）/ `full()`（方案 B 全量，形状统一）。所有列表端点返回此形状。
- 前端 `lib/platform.ts` 的 `PageResult<T>` 镜像 + 通用 `components/ui/pagination.tsx`。
- 各组件原生分页形状由适配器归一：DS `{totalList,total,currentPage,totalPage}`、StreamPark MyBatis-Plus `{records,total,current,pages}`、OM `{hits,total}`。
- DS 项目/工作流走方案 B（全量 PageResult.full）；DS 运行历史走方案 A（服务端分页，且**限定近 3 天** startDate/endDate 避免无界增长）；StreamPark apps 走服务端分页。

### 内置网关
`platform-service/.../gateway/LinkisProxyController`：`/api/linkis/**` → `${linkis.base-url}/api/rest_j/v1/**`。
- `LINKIS_MOCK=true` 返回同构 mock；`LINKIS_MOCK=false` 转发真 Linkis。**未做 Linkis token/SSO 桥接，仅透传**。

### 认证
JWT（`Authorization: Bearer <token>`）。`security/JwtAuthFilter` 解析，`SecurityConfig` 放行 `/api/platform/auth/login` + `/actuator/**`，其余需认证。种子账号 admin/admin123（`seed/DataInitializer`，仅留 admin，无工作空间）。登录后跳 `/lineage`。

### 外部组件接入（防腐层模式）
每个组件 = `Client`（适配 + 归一）+ `Controller`（封装成 `/api/platform/{component}/**`，继承 JWT 鉴权）。前端只认平台网关，不直连组件。
- **OpenMetadata（P2 血缘）**：`lineage/OpenMetadataClient` + `LineageController`。`/lineage/health|search|{type}/name/{fqn}|table/detail/{fqn}`。**坑**：OM 1.6 血缘响应**无 `edges` 字段**，边在 `upstreamEdges`/`downstreamEdges`（每条 `{fromEntity,toEntity}`）；查询实体在 `entity` 字段**不在 `nodes` 里**，适配器要补进 nodes 才能作焦点节点；节点 FQN 字段是 `fullyQualifiedName` 不是 `fqn`；中文 FQN 必须 `URI.create()` 后传 `URI` 对象给 RestClient，**不能传 String**（会二次编码 `%XX`→`%25XX` 致 404）。
- **DolphinScheduler（P3 离线调度）**：`scheduler/DolphinSchedulerClient` + `SchedulerController`。`/scheduler/projects|datasources|projects/{name}/workflows[/{id}][/{id}/release|trigger]|projects/{name}/instances`。**离线任务开发**：`features/scheduler/WorkflowEditor.tsx` 新建/编辑工作流（SQL/SHELL 任务 + 前置依赖 + DAG 预览 + 保存 create/update + 上线 + 触发）。**坑**：DS 2.x `processDefinitionJson` 的 task envelope 是 `{type,name,id,params,description,timeout:{strategy:'',interval:null,enable:false},runFlag,conditionResult:{successNode:[''],failedNode:['']},dependence:{},maxRetryTimes:'0',retryInterval:'1',taskInstancePriority,workerGroup,preTasks}`（**不是** `retries/delayTime`）；`process/save|update` 参数走 **form body**（不是 query/JSON，会 500）；SQL 任务 `datasource` 必须是有效数据源 ID（`datasource:0` 被拒→"parameter invalid"），SHELL 不需要数据源。SHELL 全流程可用；SQL 需用户在 DS 授权数据源后才能保存（数据源选择器：`/scheduler/datasources` 端点已就绪，前端 SQL 任务下拉待接）。
- **StreamPark（P5 实时，只读）**：`streampark/StreamParkClient` + `StreamParkController`。`/streampark/dashboard|projects|envs|clusters|teams|apps`。**仅只读**，绝不接 build/deploy/start/cancel。**坑**：`app/list` 参数必须 **form body** `teamId=...`（query/JSON 都 500）；teamId 由配置 `STREAMPARK_TEAM_ID` 注入（不调 `user/setTeam` 会话写操作）。

## 约定

### 前端
- 按 feature 组织。组件 PascalCase，hooks `use` 前缀，CSS 变量走 `globals.css` 的 `--color-*`/`--radius`，不硬编码颜色。
- i18n：可见文案进 `messages/*.json`，中英都加。
- mock 集中在 `lib/mock.ts`（仅 scriptis/datasource/governance/login 假数据，DSS workspace/project/orchestrator/appconn 已删）。
- 画布用 `@xyflow/react`，节点 data 必须带 index signature 满足 `Record<string,unknown>`；血缘用 `features/lineage/LineageExplorer`，调度 DAG 用 `features/scheduler/SchedulerExplorer`（查看）/ `WorkflowEditor`（开发）。
- 列表分页统一用 `components/ui/pagination.tsx`，消费 `PageResult`。

### 后端
- 包按域分：`auth/security/config/gateway/common/seed/lineage/scheduler/streampark`。
- Controller 返回 `ApiResponse.ok(data)`；业务异常抛 `BizException(status,msg)`，`GlobalExceptionHandler` 兜底；`NoResourceFoundException`/`NoHandlerFoundException`→404（已删端点干净 404，不报 500）。
- 外部组件适配器返回原始 `JsonNode`（`dataNode`/`dataNodeForm`/`requestNode`），上层用 `mapper.convertValue(node, TypeReference)` 归一。

## 坑（踩过的）

- **`NEXT_PUBLIC_*` 构建时变量**：必须 Dockerfile `ARG` + compose `build.args` 注入，运行时 env 不生效。已配好。
- **pnpm 11.5**：`pnpm-workspace.yaml` 用 `allowBuilds:` map；`.npmrc` 有 `verify-deps-before-run=false` + npmmirror。
- **国内镜像源**：Maven `platform-service/settings.xml`（阿里云，Dockerfile 已 COPY）；npm `web/.npmrc`；Docker 守护进程镜像源在宿主配置。
- **xyflow v12 类型**：`useNodesState<Node<Data>>`，`NodeProps<Node<Data>>`，Data 接口要 index signature。
- **Linkis 版本**：DSS 用的 `1.14.2-wds` 是微众定制版，与本平台无关；本平台接**社区原版 Apache Linkis**。
- **Fact-Forcing Gate hook**：Write 新文件 / Edit / 破坏性 Bash 前会被要求陈述事实（导入方、受影响、数据字段、用户原话 / 删除清单+回滚+原话）。照做即可，陈述后重试同一操作。**破坏性 `rm -rf` 会被反复拦**，用 `git rm -r` 代替（文件已提交时）。
- **OM token 是用户级 1 小时短期**（OM_USER）；DS/SP token 长期。token 走 `.env`（gitignored，不提交），`.env.example` 留空占位。
- **Docker 端口冲突**：本机常有 DSS 残留容器（`platform-service`/`platform-mysql`/`dss-web-nextjs`）占 8088/3306/3000。`docker compose down --remove-orphans` 清；或 `docker rm -f <旧容器名>`。
- **构建加速**：两个 Dockerfile 都用 `# syntax=docker/dockerfile:1.7` + `--mount=type=cache`（Maven `~/.m2`、pnpm store、`.next/cache`），改代码后二次构建秒级。

## 路线图

- ✅ P1 地基：平台服务 + 网关 + 登录/JWT
- ✅ P2 元数据血缘：OpenMetadata（搜索 + 血缘画布 + 下钻 + 表详情抽屉 + 深度滑块）
- ✅ P3 离线调度：DolphinScheduler（项目/工作流列表 + DAG 查看 + 上下线 + 触发 + 运行历史近3天分页 + **工作流开发 SQL/SHELL**）
- ✅ P5 实时开发：StreamPark（只读总览 dashboard + Flink 环境/项目 + 应用列表分页）
- ⬜ P4 数据同步：SeaTunnel
- ⬜ P6 数据接口：SQL→REST 快捷发布
- ⬜ SQL 任务数据源选择器前端接线；OM 自动入血缘（依赖任务上线）；Linkis SSO/token 桥接；RBAC 细化；YARN/HDFS 监控页

## 重要边界

- **不要碰** `/Users/lbc/Public/www/DataSphereStudio`（原 DSS 参考仓库，仅参考）。
- 真实组件（Linkis/DS/SeaTunnel/StreamPark/OpenMetadata）是**独立部署的外部系统**，本平台通过 REST/网关对接，不在本仓库内实现。
- 提交前跑 `pnpm typecheck && pnpm test`（前端）和 `mvn -DskipTests compile`（后端，或 docker maven）确保绿。
- `.env` 含真实 token，**gitignored，不提交**；只提交 `.env.example`（token 留空）。
