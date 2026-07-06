# 记账 APP 产品需求文档

版本：v2.0  
日期：2026-07-05  
状态：最终确认版，可进入编码阶段  
参考素材：项目目录 `参考/` 下 6 张截图

## 1. 项目定位

本项目开发一款个人记账 APP 的 H5 高保真原型，第一版采用 React + Vite 实现移动端体验，后端采用 Docker 化部署。产品重点是快速记账、账单明细、分类统计、个人多账本和图片凭证。

项目不做复杂财务系统，也不引入增长、会员、工具和家庭协作功能。第一版目标是把“登录后创建账本、记录收支、查看流水、查看图表统计、管理分类和账本”这条核心闭环做稳定。

## 2. 已确认技术方案

### 2.1 前端

- React
- Vite
- TypeScript
- 自定义 CSS
- lucide-react 图标
- 移动端优先 H5 高保真原型
- 项目结构预留后期 App 化空间

### 2.2 后端

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT
- bcrypt
- multer 或同类上传中间件

### 2.3 部署与运行

- 使用 Docker Compose 管理后端服务和 PostgreSQL。
- 图片凭证使用后端本地上传目录保存。
- 上传目录通过 Docker volume 持久化。

## 3. 项目结构

采用前后端分离 monorepo：

```text
记账app/
  docs/
    PRD.md
    ROADMAP.md
  apps/
    web/
      React + Vite 前端
    api/
      Express + Prisma 后端
  packages/
    shared/
      前后端共享类型、常量、分类配置
  docker-compose.yml
  README.md
```

## 4. 明确不做的功能

以下功能已确认取消，第一版及当前项目范围均不引入：

- 发现页。
- 预算功能。
- VIP。
- 积分。
- 徽章。
- 邀请好友。
- 打卡。
- 家庭账单。
- 家庭成员权限。
- 资产管家。
- 资产账户明细。
- 发票助手。
- 优惠券。
- 房贷计算器。
- 汇率换算器。
- 支付方式管理。
- 商家名称。
- 地理位置。
- 标签系统。
- 周期账单。
- 账单导入。
- 账单导出。
- OCR 识别。
- 退款关联。
- 转账记账。
- 手机号、邮箱、短信验证码、微信或第三方登录。
- 找回密码。

## 5. 页面范围

第一版保留 4 个核心页面：

```text
明细 / 图表 / 记账 / 我的
```

### 5.1 明细页

页面目标：查看当前账本、当前月份的收支概览和流水列表。

核心内容：

- 顶部黄色区域。
- 当前年份、月份选择。
- 当前账本名称。
- 本月收入。
- 本月支出。
- 本月结余。
- 按日期分组的账单流水。
- 每日支出/收入合计。
- 单条账单展示分类图标、分类名称、备注、金额。
- 支出金额显示为负数，收入金额显示为正数。
- 底部导航。
- 中间突出记账按钮。

核心交互：

- 切换月份。
- 点击账单进入详情或编辑。
- 删除账单需要二次确认。
- 无数据时展示空状态和“去记一笔”入口。

### 5.2 图表页

页面目标：查看月度收支趋势和分类排行。

第一版只做：

- 支出/收入切换。
- 当前月份每日趋势折线图。
- 总金额。
- 日均金额。
- 分类排行榜。
- 分类金额。
- 分类占比。
- 黄色进度条。

不做：

- 周统计。
- 年统计。
- 饼图。
- 多账本对比。
- 同比/环比。
- 预算线。
- 自定义日期范围。

### 5.3 记账页

页面目标：快速新增或编辑一笔支出/收入。

核心内容：

- 顶部支出/收入切换。
- 取消按钮。
- 分类网格。
- 金额显示。
- 备注输入。
- 日期选择。
- 图片凭证上传。
- 数字键盘。
- 完成按钮。

核心规则：

- 默认进入支出记账。
- 默认选中第一个可用支出分类。
- 金额必须大于 0。
- 备注可为空。
- 图片凭证可为空。
- 单笔账单最多 1 张图片。
- 保存成功后返回明细页并刷新数据。

### 5.4 我的页

页面目标：承载账号、账本、分类和系统设置。

核心内容：

- 用户基础信息。
- 当前账本。
- 账本管理。
- 分类管理。
- 修改昵称。
- 修改密码可作为二期，第一版可不做。
- 退出登录。

不展示：

- VIP。
- 积分。
- 徽章。
- 邀请好友。
- 打卡。
- 家庭账单。
- 资产管家。
- 优惠券。
- 发票助手。
- 房贷计算器。

## 6. 认证方案

第一版采用用户名密码登录：

- 用户名注册。
- 密码登录。
- 用户名唯一。
- 用户名长度 3-20 位。
- 密码至少 6 位。
- 密码使用 bcrypt 哈希存储。
- 登录成功返回 JWT。
- 前端将 JWT 存储在 localStorage。
- API 请求统一携带 `Authorization: Bearer <token>`。
- 后端业务接口统一校验 JWT。
- 用户只能访问自己的账本、分类、账单和图片。

## 7. 数据库设计

最终仅保留 4 张核心表：

```text
User
Book
Category
Bill
```

### 7.1 User

用户表。

字段建议：

```text
id
username
passwordHash
nickname
avatarUrl
createdAt
updatedAt
```

规则：

- `username` 唯一。
- 注册成功后自动创建默认账本。
- 注册成功后自动生成默认分类副本。

### 7.2 Book

个人账本表。

字段建议：

```text
id
userId
name
isDefault
createdAt
updatedAt
```

第一版支持：

- 创建账本。
- 重命名账本。
- 切换账本。
- 删除账本。
- 注册后自动创建默认账本。

规则：

- 不做家庭共享。
- 不做成员权限。
- 不做账本归档。
- 不做账本封面。
- 不允许删除最后一个账本。
- 删除账本需要二次确认。
- 删除账本会删除该账本下账单及对应图片凭证。

### 7.3 Category

分类表。

字段建议：

```text
id
userId
type        expense / income
name
icon
sort
isDefault
isActive
createdAt
updatedAt
```

第一版支持：

- 默认支出分类。
- 默认收入分类。
- 用户自定义分类。
- 新增分类。
- 重命名分类。
- 停用分类。
- 调整排序。

规则：

- 每个用户注册后拥有自己的默认分类副本。
- 分类分为支出和收入。
- 已被账单使用的分类不物理删除，只允许停用。
- 未被账单使用的分类可以删除。
- 停用分类不再出现在记账分类选择中，但历史账单仍正常展示。

默认支出分类建议：

```text
餐饮、购物、日用、交通、蔬菜、水果、零食、运动、
娱乐、通讯、服饰、美容、住房、居家、孩子、长辈、
社交、旅行、烟酒、数码、汽车、医疗、书籍、学习、
宠物、礼金、礼物、办公、维修、捐赠、彩票、亲友
```

默认收入分类建议：

```text
工资、奖金、兼职、理财、礼金、报销、退款、其他
```

### 7.4 Bill

账单表。

字段建议：

```text
id
userId
bookId
categoryId
type          expense / income
amount
remark
imageUrl
happenedAt
createdAt
updatedAt
```

第一版支持：

- 新增支出。
- 新增收入。
- 编辑账单。
- 删除账单。
- 上传一张图片凭证。
- 查看图片凭证。
- 按月份查询账单。
- 按日期分组展示账单。
- 按分类筛选账单。
- 按账本隔离账单。
- 明细页展示日合计和月合计。
- 图表页根据账单生成月度趋势和分类排行。

规则：

- 金额必须大于 0。
- 数据库金额建议使用 Decimal，避免浮点误差。
- `remark` 可为空。
- `imageUrl` 可为空。
- 删除账单时同步删除图片凭证。
- 编辑账单更换图片时删除旧图片。

## 8. 图片凭证规则

第一版采用后端本地上传目录保存图片：

- 单笔账单最多 1 张图片。
- 单张最大 5MB。
- 支持格式：`jpg`、`jpeg`、`png`、`webp`。
- 后端校验 MIME 类型。
- 后端校验文件大小。
- 上传后生成唯一文件名。
- 图片保存在后端 `uploads` 目录。
- Docker 使用 volume 持久化 `uploads`。
- 图片通过后端静态资源路径访问，例如 `/uploads/bills/xxx.webp`。
- 删除账单时同步删除图片。
- 编辑账单更换图片时删除旧图片。
- 前端上传前展示预览。
- 暂不做图片压缩。
- 暂不接入 OSS、S3、MinIO。

## 9. API 范围

### 9.1 Auth

```text
POST /auth/register
POST /auth/login
GET  /users/me
```

### 9.2 Books

```text
GET    /books
POST   /books
PATCH  /books/:id
DELETE /books/:id
```

### 9.3 Categories

```text
GET    /categories
POST   /categories
PATCH  /categories/:id
DELETE /categories/:id
PATCH  /categories/:id/disable
PATCH  /categories/reorder
```

### 9.4 Bills

```text
GET    /bills
GET    /bills/:id
POST   /bills
PATCH  /bills/:id
DELETE /bills/:id
POST   /uploads/bill-image
```

账单查询参数建议：

```text
bookId
month
type
categoryId
```

### 9.5 Stats

```text
GET /stats/monthly
GET /stats/categories
```

统计查询参数建议：

```text
bookId
month
type
```

## 10. 统计规则

- 月收入：当前账本、当前月份所有收入账单金额之和。
- 月支出：当前账本、当前月份所有支出账单金额之和。
- 月结余：月收入减月支出。
- 日收入：某日期所有收入账单金额之和。
- 日支出：某日期所有支出账单金额之和。
- 趋势图：按当前月份每一天聚合金额。
- 日均金额：月总金额除以当月天数，第一版按自然日计算。
- 分类排行金额：当前月份、当前类型下按分类聚合金额。
- 分类占比：分类金额除以当前类型月总金额。

## 11. 前端页面结构建议

```text
apps/web/src/
  app/
    App.tsx
    router.tsx
  pages/
    DetailPage.tsx
    ChartPage.tsx
    RecordPage.tsx
    ProfilePage.tsx
    LoginPage.tsx
  components/
    TabBar.tsx
    AmountKeyboard.tsx
    CategoryGrid.tsx
    BillList.tsx
    StatCard.tsx
    ImageUploader.tsx
  services/
    api.ts
    auth.ts
  styles/
    theme.css
    global.css
```

## 12. 后端结构建议

```text
apps/api/src/
  app.ts
  server.ts
  config/
    env.ts
  modules/
    auth/
    users/
    books/
    categories/
    bills/
    stats/
    uploads/
  middlewares/
    authMiddleware.ts
    errorMiddleware.ts
    uploadMiddleware.ts
  prisma/
    schema.prisma
```

## 13. 视觉风格

参考截图的核心视觉方向：

- 主色使用明亮黄色，建议 `#FFD83D`。
- 页面背景使用浅灰，建议 `#F5F5F5`。
- 卡片使用白色。
- 主文字使用接近黑色，建议 `#222222`。
- 次级文字使用灰色，建议 `#8A8A8A`。
- 分类图标采用线性图标。
- 当前选中分类使用黄色圆形背景。
- 未选中分类使用浅灰圆形背景。
- 底部导航固定。
- 中间记账按钮突出。

注意：

- 不直接使用参考产品的品牌名、商标、图标素材。
- 可以参考交互结构和页面布局，但品牌、文案和图标应做自有化处理。

## 14. 验收标准

第一版完成时应满足：

- 用户可以注册和登录。
- 登录后自动拥有默认账本和默认分类。
- 用户可以创建、切换、重命名、删除个人账本。
- 用户不能删除最后一个账本。
- 用户可以新增、编辑、删除支出和收入账单。
- 用户可以为账单上传一张图片凭证。
- 图片凭证刷新后仍可访问。
- 删除账单会删除对应图片。
- 明细页按月份展示收入、支出、结余。
- 明细页按日期分组展示账单。
- 图表页展示月度趋势折线图。
- 图表页展示分类排行榜。
- 用户只能访问自己的数据。
- 发现页、预算、VIP、积分、徽章、家庭、资产和工具功能均不出现。
