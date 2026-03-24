#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "正在打开浏览器预览页面..."

# 检测操作系统并使用相应的命令打开浏览器
case "$(uname -s)" in
   Darwin*)
     # macOS
     open "$SCRIPT_DIR/dist/index.html"
     ;;
   Linux*)
     # Linux
     xdg-open "$SCRIPT_DIR/dist/index.html"
     ;;
   CYGWIN*|MINGW*|MSYS*)
     # Windows
     start "$SCRIPT_DIR/dist/index.html"
     ;;
   *)
     echo "不支持的操作系统，请手动打开 dist/index.html"
     ;;
esac