#!/bin/bash

# 快速启动脚本
# 根据选择使用不同的启动方式

echo "粤晋山海户外向导 - 启动选项"
echo "=========================="
echo "1. 开发服务器 (npm run dev)"
echo "2. 预览服务器 (npm run preview)"
echo "3. 兼容性构建 + 预览 (npm run build:compat && npm run preview)"
echo "4. 仅兼容性构建 (npm run build:compat)"
echo "=========================="

read -p "请选择启动方式 (1-4): " choice

case $choice in
    1)
        echo "启动开发服务器..."
        npm run dev
        ;;
    2)
        echo "启动预览服务器..."
        npm run preview
        ;;
    3)
        echo "构建兼容性版本并启动预览服务器..."
        npm run build:compat
        echo "预览服务器启动中..."
        npm run preview
        ;;
    4)
        echo "构建兼容性版本..."
        npm run build:compat
        echo "构建完成！文件位于 dist/ 目录"
        echo "使用 'npm run preview' 启动预览服务器"
        ;;
    *)
        echo "无效选择，使用默认启动开发服务器..."
        npm run dev
        ;;
esac