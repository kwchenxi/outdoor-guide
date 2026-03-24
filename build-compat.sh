#!/bin/bash

# 兼容性构建脚本
# 此脚本将创建一个兼容性更好的构建版本，移除 ES 模块语法，提高浏览器兼容性

echo "开始兼容性构建..."

# 1. 替换 HTML 模板
echo "1. 替换 HTML 模板..."
cp index-compat.html index.html

# 2. 执行构建
echo "2. 执行构建..."
npm run build

# 3. 恢复原始 HTML 模板
echo "3. 恢复原始 HTML 模板..."
# 尝试从 git 恢复，如果失败则不做任何操作
git checkout index.html 2>/dev/null || true

echo "兼容性构建完成！"
echo "构建输出位置: dist/"
echo "特点:"
echo "- 使用 IIFE 格式（立即执行函数表达式）"
echo "- 移除了 type='module' 属性"
echo "- 目标浏览器: ES2015+（兼容大多数现代浏览器）"
echo "- 代码未分割，减少请求数量"