# InstantDB 全栈应用迁移指南

## 概述

本应用已成功迁移到使用 InstantDB 的全栈架构，实现了以下核心功能：

- ✅ 用户可以发布和分享徒步路线
- ✅ 用户可以纠正和改进路线信息
- ✅ 用户可以收藏喜欢的路线
- ✅ 实时数据同步
- ✅ 社区驱动的路线数据库

## 数据库架构

### 表结构

1. **trails** - 路线主表
   - 存储路线的基本信息（名称、位置、难度等）
   - 关联 routeSegments 和 gear

2. **routeSegments** - 路线段
   - 存储路线的不同走法
   - 关联 routeNodes

3. **routeNodes** - 路标节点
   - 存储详细的时间轴路标
   - 包含 GPS 坐标、描述等信息

4. **gear** - 装备信息
   - 存储必备和推荐装备
   - 关联到 trails

5. **users** - 用户信息
   - 存储用户基本信息
   - 用于收藏和纠错记录

6. **favorites** - 收藏关系
   - 用户与路线的多对多关系
   - 支持收藏和取消收藏

7. **corrections** - 纠错记录
   - 记录用户提交的纠错
   - 包含审核状态（pending/approved/rejected）

## 服务层

### db/config.ts
- InstantDB 客户端初始化
- Schema 定义
- App ID: `74a1e87c-3632-43a5-9a6b-24a9d8d2532a`

### db/trailService.ts
- `createTrail()` - 创建新路线
- `getTrail()` - 获取单个路线
- `getAllTrails()` - 获取所有路线
- `searchTrails()` - 搜索路线
- `updateTrail()` - 更新路线
- `deleteTrail()` - 删除路线
- `convertToTrailData()` - 转换数据库格式到应用格式

### db/userService.ts
- `getCurrentUserId()` - 获取/创建当前用户 ID
- `getCurrentUser()` - 获取当前用户信息
- `updateUserName()` - 更新用户名称
- `addFavorite()` - 添加收藏
- `removeFavorite()` - 移除收藏
- `isFavorite()` - 检查是否已收藏
- `getFavorites()` - 获取用户收藏列表
- `toggleFavorite()` - 切换收藏状态

### db/correctionService.ts
- `submitCorrection()` - 提交纠错
- `getCorrectionsForTrail()` - 获取路线的纠错记录
- `getUserCorrections()` - 获取用户的纠错记录
- `approveCorrection()` - 批准纠错
- `rejectCorrection()` - 拒绝纠错
- `getPendingCorrections()` - 获取待审核的纠错
- `applyCorrectionToTrail()` - 应用纠错到路线

### db/migrationService.ts
- `migrateFromLocalStorage()` - 从 localStorage 迁移数据到 InstantDB
- `clearLocalStorageAfterMigration()` - 迁移后清理 localStorage
- `getMigrationStatus()` - 获取迁移状态

### db/realtimeService.ts
- `subscribeToTrails()` - 订阅路线更新
- `subscribeToUserFavorites()` - 订阅用户收藏更新
- `subscribeToCorrections()` - 订阅纠错记录更新

## UI 功能

### 发布路线
- 在路线详情页点击"发布到社区"按钮
- 路线将保存到 InstantDB 并在社区列表中显示
- 所有用户都可以查看和搜索发布的路线

### 收藏路线
- 点击路线详情页的收藏按钮
- 收藏的路线显示在"我的收藏"页面
- 支持实时同步收藏状态

### 纠错模式
- 点击编辑图标开启纠错模式
- 点击虚线边框的内容进行纠正
- 纠错记录保存到数据库供审核

### 社区路线浏览
- 首页新增"浏览社区路线"按钮
- 显示所有社区贡献的路线
- 支持按难度、位置等筛选

## 使用说明

### 开发环境

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 应用将在 http://localhost:3000 运行

### 数据迁移

如果需要从 localStorage 迁移现有数据：

```typescript
import { migrationService } from './db/migrationService';

// 迁移数据
const results = await migrationService.migrateFromLocalStorage();
console.log(`成功: ${results.success}, 失败: ${results.failed}`);

// 查看迁移状态
const status = migrationService.getMigrationStatus();
console.log(status);

// 迁移完成后清理 localStorage（可选）
await migrationService.clearLocalStorageAfterMigration();
```

### 实时订阅

在组件中使用实时数据更新：

```typescript
import { realtimeService } from './db/realtimeService';

useEffect(() => {
  const unsubscribe = realtimeService.subscribeToTrails((trails) => {
    console.log('路线已更新:', trails);
    setTrails(trails);
  });

  return () => {
    unsubscribe();
  };
}, []);
```

## 技术栈

- **前端**: React 18 + TypeScript
- **构建工具**: Vite
- **数据库**: InstantDB
- **AI 服务**: Google Gemini 2.0 Flash
- **样式**: Tailwind CSS
- **地图**: Leaflet + OpenTopoMap

## 部署

应用已配置为静态站点，可以部署到：

- GitHub Pages
- Vercel
- Netlify
- 任何静态托管服务

部署时确保：
1. 构建应用：`npm run build`
2. 将 `dist` 目录部署到托管服务
3. InstantDB App ID 已正确配置

## 注意事项

1. **数据持久化**: 所有数据现在存储在 InstantDB 中，不再依赖 localStorage
2. **实时同步**: 多个用户可以同时查看和编辑路线，数据实时同步
3. **用户身份**: 每个浏览器会自动生成一个用户 ID，存储在 localStorage 中
4. **纠错审核**: 当前纠错功能会自动应用，生产环境应添加审核流程
5. **离线支持**: InstantDB 支持离线操作，数据会在恢复连接时同步

## 未来改进

- [ ] 添加用户认证系统（登录/注册）
- [ ] 实现纠错审核工作流
- [ ] 添加路线评分和评论功能
- [ ] 支持图片上传到云存储
- [ ] 添加路线分享到社交媒体
- [ ] 实现路线导出功能（GPX/KML）
