# 交付检查

日期：2026-07-05

## 自动化验证

当前已通过：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @accounting-app/api db:generate
```

测试覆盖：

- 单元/规则层：认证、账本保护、分类删除/停用规则、账单金额和归属规则。
- API 集成层：认证、账本、分类、账单、上传、统计、统一错误响应。
- 前端组件层：登录注册、token 存储、四页导航、记账闭环、危险操作确认。

## 安全自查

- 密码使用 bcrypt 哈希存储。
- 业务接口通过 JWT 鉴权。
- 后端以 JWT 用户为准，不信任前端传入的 `userId`。
- 账本、分类、账单均校验用户归属。
- 账单校验账本、分类、类型一致性。
- 金额以字符串进入业务层，数据库使用 Prisma Decimal / numeric。
- 图片上传限制单文件、5MB、jpg/jpeg/png/webp。
- 未知错误统一返回 `Internal server error`，不暴露堆栈、密钥或数据库错误细节。

## 已知限制

- 当前机器未安装 Docker Desktop，真实 Docker Compose 冒烟未执行。
- 当前机器无真实 PostgreSQL 测试库，Prisma migrate 与真实数据库集成测试未执行。
- E2E 目前由前端组件级核心闭环测试替代；后续如安装 Playwright，可补真实浏览器 E2E。

## 后续建议

- 安装 Docker Desktop 后执行 Docker 冒烟和真实 PostgreSQL 迁移。
- 引入 Playwright，覆盖注册登录 -> 记一笔 -> 明细 -> 图表核心闭环。
- 在真实设备尺寸上继续微调移动端视觉和交互细节。
