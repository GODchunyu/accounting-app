# 交付检查

日期：2026-07-06

## 自动化验证

当前已通过：

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm --filter @accounting-app/api db:generate
docker compose up -d --build
docker compose ps
```

测试覆盖：

- 单元/规则层：认证、账本保护、分类删除/停用规则、账单金额和归属规则。
- API 集成层：认证、账本、分类、账单、上传、统计、统一错误响应。
- 前端组件层：登录注册、token 存储、四页导航、记账闭环、危险操作确认。
- 浏览器 E2E 层：Chromium mobile viewport 覆盖注册登录 -> 记一笔 -> 明细 -> 图表核心闭环。
- Docker 冒烟层：PostgreSQL healthy、API migration deploy、API 启动、注册登录、默认账本/分类、创建账单、明细查询、月度统计、分类排行。

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

- Playwright 当前只覆盖 Chromium mobile viewport；如需正式多端回归，可继续扩展 WebKit、桌面端和更多异常路径。

## 后续建议

- 在真实设备尺寸上继续微调移动端视觉和交互细节。
