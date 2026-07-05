# Accounting App

个人记账 APP 的 H5 高保真原型，采用 React + Vite 前端、Express + Prisma 后端、PostgreSQL 数据库和 Docker Compose 部署方案。

## 文档入口

- [AGENTS.md](AGENTS.md)：AI agent 启动入口。
- [CLAUDE.md](CLAUDE.md)：项目唯一执行规则。
- [docs/PRD.md](docs/PRD.md)：产品需求文档。
- [docs/ROADMAP.md](docs/ROADMAP.md)：路线图、任务追踪和 ADR。

## 项目结构

```text
apps/
  web/      React + Vite H5
  api/      Express + Prisma API
packages/
  shared/   共享类型、默认分类和常量
docs/       权威项目文档
```

## 本地开发

复制环境变量模板：

```bash
cp .env.example .env
```

安装依赖：

```bash
pnpm install
```

启动数据库和 API 容器：

```bash
docker compose up -d
```

生成 Prisma Client：

```bash
pnpm db:generate
```

启动开发服务：

```bash
pnpm dev
```

## 质量门禁

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 当前说明

本仓库当前处于 Phase 0 工程初始化阶段。若本机没有 Docker，`docker compose up -d` 暂无法运行，但配置文件已就位。

