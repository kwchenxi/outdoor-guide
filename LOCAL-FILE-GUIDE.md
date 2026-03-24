# 直接访问本地静态文件指南

## 问题描述

通常情况下，使用 `npm run build` 构建的静态网站需要通过 HTTP 服务器访问，直接使用 `file://` 协议打开会遇到 CORS 错误：

```
Access to script at 'file:///assets/index.js' from origin 'null' has been blocked by CORS policy
```

这是因为浏览器出于安全考虑，不允许从本地文件系统加载 ES 模块（`type="module"`）。

## 解决方案

我们提供了 `npm run build:offline` 命令，它会构建一个可以直接在文件系统中打开的版本，无需 HTTP 服务器。

## 使用方法

### 1. 构建本地文件版本

```bash
npm run build:offline
```

### 2. 直接打开 HTML 文件

构建完成后，可以直接打开 `dist/index.html` 文件：

- **Windows**: 双击 `dist/index.html` 文件
- **macOS**: 双击文件或右键选择"打开方式" -> "浏览器"
- **Linux**: 使用文件管理器打开或使用命令 `xdg-open dist/index.html`

## 工作原理

`build:offline` 命令通过以下方式使网站可以直接在文件系统中打开：

1. **移除 ES 模块类型**: 将 `<script type="module">` 改为普通的 `<script>` 标签
2. **使用 IIFE 格式**: 将 JavaScript 代码打包为立即执行函数表达式格式，避免模块加载问题
3. **相对路径修复**: 确保所有资源使用相对路径，可以在文件系统中正确加载
4. **兼容性设置**: 使用 ES2015 目标，兼容更多浏览器

## 注意事项

- 此构建方式会生成一个稍大的 JavaScript 文件，因为不能利用模块懒加载
- 构建后的文件可能比标准构建稍大，但提供了更好的离线访问体验
- 适用于演示、离线分享或无法使用 HTTP 服务器的场景

## 与其他构建命令的区别

- `npm run build`: 标准构建，需要 HTTP 服务器
- `npm run build:compat`: 兼容性构建，仍需要 HTTP 服务器但兼容更多浏览器
- `npm run build:offline`: 本地文件构建，可以直接打开 HTML 文件，无需服务器

## 故障排除

如果仍然遇到问题，请尝试：

1. 确保使用现代浏览器（Chrome, Firefox, Safari, Edge 最新版本）
2. 尝试在不同浏览器中打开
3. 检查控制台是否还有其他错误
4. 确保使用 `npm run build:offline` 而不是 `npm run build`