#!/bin/bash

echo "构建可以直接在文件系统中打开的静态网站..."

# 使用本地文件配置构建
npx vite build --config vite.config.localfile.ts

echo "构建完成！"
echo "现在可以直接双击打开 dist/index.html 文件，无需 HTTP 服务器。"
echo ""
echo "提示："
echo "- 在 Windows 上可以直接双击 index.html 文件"
echo "- 在 macOS 上可以双击或右键选择\"打开方式\" -> \"浏览器\""
echo "- 在 Linux 上可以使用文件管理器打开或使用命令："
echo "  xdg-open dist/index.html"