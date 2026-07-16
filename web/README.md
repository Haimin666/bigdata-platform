# DSS Web (Next.js)

DataSphere Studio 前端的现代 Next.js 重写（里程碑 1：登录 + 主框架 + 工作空间首页/项目管理 + Docker）。

## 技术栈

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · next-intl · TanStack Query · axios · sonner · pnpm

## 本地开发

```bash
pnpm install
cp .env.example .env
# 在 .env 中设置 DSS_API_HOST 指向后端，例如 http://127.0.0.1:8088
pnpm dev          # http://localhost:3000
```

开发期 `next.config.ts` 的 `rewrites` 会把 `/api/*` 代理到 `DSS_API_HOST`。

## 鉴权（沿用后端 cookie 会话）

- 登录 `POST /api/rest_j/v1/user/login`（密码按 `GET /user/publicKey` 的 `enableLoginEncrypt` 决定是否 RSA 加密）
- 管理员 `GET /jobhistory/governanceStationAdmin`
- 登录后首页 `GET /dss/framework/workspace/getWorkspaceHomePage`
- 登出 `POST /user/logout`
- `baseInfo` 存于 localStorage，受保护路由在客户端 layout 中做未登录跳转 `/login`

## 构建与脚本

```bash
pnpm build        # 产出 .next/standalone
pnpm start        # 生产启动
pnpm typecheck    # 类型检查
pnpm lint         # eslint
pnpm test         # vitest 单测（auth 登录/RSA 分支）
```

## Docker 部署

```bash
# 1) 构建并启动（前端独立容器，/api 代理到 DSS_API_HOST）
DSS_API_HOST=http://127.0.0.1:8088 docker compose up --build -d
# 访问 http://localhost:3000
```

`DSS_API_HOST` 指向后端 dss-server/Linkis 网关地址。容器内默认用 `host.docker.internal` 访问宿主机后端（Linux 需加 `--add-host=host.docker.internal:host-gateway` 或直接填后端 IP）。

若希望用 nginx 做前置反代，参考 `nginx.conf`。

## 目录结构

```
src/
├─ app/
│  ├─ layout.tsx                 # 根布局 (QueryProvider + Toaster)
│  └─ [locale]/
│     ├─ layout.tsx              # next-intl Provider
│     ├─ login/page.tsx          # 登录页
│     └─ (app)/                  # 受保护路由组
│        ├─ layout.tsx           # 未登录守卫
│        ├─ workspaceHome/       # 工作空间首页
│        └─ projects/            # 项目管理
├─ components/
│  ├─ shell/                     # Header/Sidebar/Footer/Watermark/UserMenu/WorkspaceSwitcher
│  └─ ui/                        # 基础组件 (Button/Input/Card/Dropdown/...)
├─ features/
│  ├─ workspace/                 # 工作空间 API + hook
│  └─ projects/                  # 工程 API + 列表 + 创建弹窗
├─ lib/                          # api (axios) / auth (login/RSA/logout) / types / apiPaths
└─ i18n/                         # routing + request
```

## 范围说明（里程碑 1）

本次只迁移：登录页、主框架 shell、工作空间首页、项目管理。后续里程碑：Scriptis 脚本 IDE、工作流编排画布、其余子应用、插件系统。
