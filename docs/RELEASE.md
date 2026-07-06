# 发布与验收清单

日期：2026-07-06  
适用版本：第一版个人记账核心闭环

## 1. 发布前自动化门禁

代码门禁：

```bash
pnpm verify
```

Docker 冒烟：

```bash
pnpm verify:docker
```

通过标准：

- `pnpm verify` 输出 `all checks passed`。
- `pnpm verify:docker` 结束后 `accounting-api` 与 `accounting-postgres` 均为 `healthy`。
- Playwright E2E 覆盖注册登录、图片凭证上传、记账、明细凭证缩略图和图表核心闭环。

## 2. 生产环境变量

从模板复制：

```bash
cp .env.production.example .env
```

上线前必须替换：

- `JWT_SECRET`：至少 32 位的真实随机密钥，不能使用模板值。
- `POSTGRES_PASSWORD`：真实数据库密码，不能使用模板值。
- `API_PORT`：服务器上对外暴露的 API 端口。
- `POSTGRES_PORT`：如不需要外部访问数据库，建议仅在内网或防火墙内暴露。

替换后运行生产环境变量自检：

```bash
pnpm env:check -- .env
```

生产保护：

- `NODE_ENV=production` 时，API 会拒绝使用模板 `JWT_SECRET` 启动。
- `pnpm env:check -- .env` 会拒绝模板 `JWT_SECRET`、`POSTGRES_PASSWORD` 和非 production 配置。
- Docker Compose 会根据 `.env` 生成 API 的 `DATABASE_URL`。

## 3. Docker 启动

```bash
docker compose up -d --build --wait api
docker compose ps
```

启动时 API 容器会自动执行：

```bash
prisma migrate deploy
```

通过标准：

- PostgreSQL 为 `healthy`。
- API 为 `healthy`。
- API 日志出现 `No pending migrations to apply` 或 migration 成功应用。
- API 日志出现 `API listening on http://localhost:3000`。

## 4. 人工验收路径

在浏览器打开前端后，按以下顺序验收：

1. 注册新用户。
2. 确认自动生成默认账本和默认分类。
3. 新增一笔支出，填写金额、备注，并上传一张图片凭证。
4. 返回明细页，确认账单金额、备注、分类和凭证缩略图展示正常。
5. 切换到图表页，确认总金额、趋势图和分类排行展示正常。
6. 在我的页新增账本和分类。
7. 尝试删除最后一个账本，确认被阻止。
8. 删除普通账本或账单前，确认出现二次确认。
9. 退出登录后，确认回到登录页。

## 5. 数据与文件持久化

Docker volume：

- `postgres_data`：PostgreSQL 数据。
- `uploads_data`：图片凭证。

注意事项：

- 第一版图片使用本地 Docker volume，适合单机部署。
- 正式规模化上线前，如需要多实例或对象存储，应新增 ADR 迁移到 OSS/S3/MinIO。

## 6. 回滚与恢复

代码回滚：

```bash
git log --oneline -5
git revert <commit>
docker compose up -d --build --wait api
```

数据恢复：

- 备份当前数据库：

```bash
pnpm db:backup
```

- 从备份恢复数据库：

```bash
pnpm db:restore -- backups/<backup-file>.dump
```

- 回滚前不要删除 `postgres_data` 或 `uploads_data` volume，除非明确要清空数据。
- 恢复会覆盖当前数据库对象；正式生产环境建议先复制备份文件并确认维护窗口。

## 7. 当前已知限制

- 仅覆盖 Chromium mobile viewport E2E。
- 未接入真实手机 App 壳。
- 图片凭证仍为本地 volume 存储。
- 未做导入导出、OCR、预算、资产、家庭账本等已取消功能。
