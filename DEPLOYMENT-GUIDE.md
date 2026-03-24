# 粤晋山海户外向导 - 部署流程说明

## 问题解析

您遇到的错误：
```
Access to script at 'file:///assets/index.js' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: chrome, chrome-extension, chrome-untrusted, data, http, https, isolated-app.
```

这是因为浏览器的同源策略(Same-Origin Policy)不允许从 `file://` 协议加载脚本文件。直接双击打开 HTML 文件会导致这个问题。

## 解决方案

### 方案一：本地预览服务器（推荐）

Vite 提供了一个内置的预览服务器，可以解决这个问题：

1. **标准预览（现代浏览器）**
   ```bash
   npm run preview
   ```
   这将启动一个开发服务器，通常在 `http://localhost:4173`

2. **兼容性预览（旧浏览器）**
   ```bash
   npm run build:compat
   npm run preview
   ```
   这会先构建兼容性版本，然后启动预览服务器

### 方案二：本地开发服务器（开发阶段）

如果您还在开发阶段，使用开发服务器：
```bash
npm run dev
```
这通常在 `http://localhost:3000` 启动服务器

### 方案三：使用简单的 HTTP 服务器

如果您想用自己选择的服务器：

1. **使用 Python 3**
   ```bash
   # 在项目根目录下运行
   python -m http.server 8000
   ```
   然后访问 `http://localhost:8000`

2. **使用 Python 2**
   ```bash
   python -m SimpleHTTPServer 8000
   ```
   然后访问 `http://localhost:8000`

3. **使用 Node.js serve**
   ```bash
   npx serve dist -l 3000
   ```
   然后访问 `http://localhost:3000`

4. **使用 PHP 内置服务器**
   ```bash
   php -S localhost:8000
   ```
   然后访问 `http://localhost:8000`

## 构建命令说明

### 标准构建（现代浏览器）
```bash
npm run build
```
特点：
- 生成优化后的代码
- 使用 ES 模块格式
- 代码分割，减少初始加载时间
- 推荐用于现代浏览器环境

### 兼容性构建（旧浏览器）
```bash
npm run build:compat
```
特点：
- 移除 `<script type="module">`，使用普通 `<script>` 标签
- 使用 IIFE 格式（立即执行函数表达式）
- 目标浏览器：ES2015+（兼容大多数现代浏览器）
- 代码不分割，减少请求数量
- 适合需要更好兼容性的环境

## 生产环境部署

### 静态网站托管

1. **Netlify**
   - 将 `dist` 文件夹内容上传到 Netlify
   - 或连接 Git 仓库自动部署
   - 免费套餐足够大多数小型项目

2. **Vercel**
   - 使用 Vercel CLI 或 Web 界面
   - 自动从 Git 仓库部署
   - 免费套餐提供 generous 配额

3. **GitHub Pages**
   ```bash
   # 构建后
   npm run build
   # 将 dist 内容推送到 gh-pages 分支
   git subtree push --prefix dist origin gh-pages
   ```

4. **传统虚拟主机**
   - 使用 FTP/SFTP 将 `dist` 文件夹内容上传到服务器
   - 确保服务器正确处理 MIME 类型
   - 配置路由，将所有请求重定向到 index.html

### 服务器配置

如果使用自己的服务器，确保配置以下内容：

**Apache (.htaccess)**
```apache
# 路由所有请求到 index.html
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# 设置正确的 MIME 类型
<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType text/css .css
</IfModule>
```

**Nginx**
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  root /path/to/dist;
  index index.html;

  # 路由所有请求到 index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # 设置正确的 MIME 类型
  location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

## 故障排除

### 问题：页面显示空白
1. 检查浏览器控制台是否有 JavaScript 错误
2. 确认使用 HTTP 服务器访问，而不是 file://
3. 检查是否正确加载了所有资源

### 问题：地图不显示
1. 检查网络连接（地图需要从外部服务器加载）
2. 确认 Leaflet CSS 和 JS 正确加载
3. 查看控制台是否有 CORS 错误

### 问题：样式丢失
1. 检查 CSS 文件是否正确加载
2. 确认 Tailwind CSS 配置正确
3. 检查路径是否正确（相对路径 vs 绝对路径）

## 推荐部署流程

1. **开发阶段**
   - 使用 `npm run dev` 进行本地开发
   - 访问 `http://localhost:3000`

2. **测试构建**
   - 运行 `npm run build` 或 `npm run build:compat`
   - 使用 `npm run preview` 测试构建结果

3. **部署到生产环境**
   - 选择托管服务（如 Netlify、Vercel）
   - 将 `dist` 文件夹内容上传到服务器
   - 配置域名和 SSL（如需要）

4. **验证部署**
   - 访问网站确认一切正常
   - 检查移动设备和不同浏览器的兼容性
   - 使用工具如 Lighthouse 检查性能

## 兼容性建议

- 使用 `npm run build:compat` 构建兼容性更好的版本
- 在不同浏览器中测试（Chrome、Firefox、Safari、Edge）
- 考虑添加 polyfill 以支持更旧的浏览器
- 使用 Can I Use 网站检查功能兼容性

## 联系与支持

如果您在部署过程中遇到问题：
1. 检查浏览器控制台的错误信息
2. 搜索相关错误信息，通常有现成的解决方案
3. 查阅 Vite 和 React 的官方文档
4. 考虑使用专业的 CI/CD 工具自动化部署过程