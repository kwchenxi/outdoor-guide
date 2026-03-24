#!/bin/bash

echo "开始构建离线可访问的静态网站..."

# 使用离线配置构建
npx vite build --config vite.config.offline.ts

echo "构建完成！现在可以直接打开 dist/index.html 文件，无需 HTTP 服务器。"