# Accounting App

个人记账 App 的 H5 高保真原型与 Docker 化后端。当前版本聚焦第一版核心闭环：注册登录、账本、分类、记账、明细、图表统计、图片凭证和我的页管理。

## 文档入口

- [AGENTS.md](AGENTS.md)：AI agent 启动入口。
- [CLAUDE.md](CLAUDE.md)：项目唯一执行规则。
- [docs/PRD.md](docs/PRD.md)：产品需求文档。
- [docs/ROADMAP.md](docs/ROADMAP.md)：路线图、任务追踪和 ADR。
- [docs/DELIVERY.md](docs/DELIVERY.md)：交付检查、安全自查和已知限制。
- [docs/RELEASE.md](docs/RELEASE.md)：发布与验收清单。

## 项目结构

```text
apps/
  web/      React + Vite H5 前端
  api/      Express + Prisma API
packages/
  shared/   共享类型、默认分类和常量
docs/       权威项目文档
```

## 本地开发

1. 复制环境变量模板：

```bash
cp .env.example .env
```

生产部署时不要使用 `.env.example` 中的默认密钥，可从 `.env.production.example` 复制并替换 `JWT_SECRET`、`POSTGRES_PASSWORD` 等敏感配置。

2. 安装依赖：

```bash
pnpm install
```

3. 生成 Prisma Client：

```bash
pnpm db:generate
```

4. 启动开发服务：

```bash
pnpm dev
```

前端默认使用 `VITE_API_BASE_URL=/api`。如前后端分开端口运行，可在 `apps/web/.env` 中设置：

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

## Docker

项目已提供 PostgreSQL 与 API 的 Docker Compose 配置：

```bash
docker compose up -d
```

当前开发机器已完成 Docker Desktop 验证。API 容器启动时会自动执行 Prisma migration：

```bash
docker compose up -d
docker compose ps
```

Docker Compose 会读取 `.env`，默认值仅用于本地开发；当 `NODE_ENV=production` 时，API 会拒绝使用模板 JWT 密钥启动。

当前 Docker 冒烟已覆盖：PostgreSQL healthy、API migration deploy、API 启动、注册登录、默认账本/分类、创建账单、明细查询、月度统计和分类排行。

## 质量门禁

完整验收：

```bash
pnpm verify
```

等价于按顺序执行：

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:generate
pnpm test:e2e
```

Docker 冒烟：

```bash
pnpm verify:docker
```

生产环境变量检查：

```bash
pnpm env:check -- .env
```

数据库备份：

```bash
pnpm db:backup
pnpm db:restore -- backups/<backup-file>.dump
```

## 当前能力

- 后端：认证、账本、分类、账单、图片上传、月度统计、分类排行、统一错误响应。
- 前端：登录注册、四页底部导航、明细页、记账页、图表页、我的页、图片凭证选择/上传、危险操作二次确认。
- 不包含：预算、发现页、VIP、积分、徽章、家庭账单、资产、发票、优惠券、房贷、导入导出、OCR、支付方式、标签、周期账单等已取消功能。
