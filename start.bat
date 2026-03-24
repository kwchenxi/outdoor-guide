@echo off
title 粤晋山海户外向导 - 启动选项

:menu
echo.
echo 粤晋山海户外向导 - 启动选项
echo ==========================
echo 1. 开发服务器 (npm run dev)
echo 2. 预览服务器 (npm run preview)
echo 3. 兼容性构建 + 预览
echo 4. 仅兼容性构建
echo 5. 退出
echo ==========================
echo.
set /p choice=请选择启动方式 (1-5): 

if "%choice%"=="1" (
    echo 启动开发服务器...
    npm run dev
    goto end
)
if "%choice%"=="2" (
    echo 启动预览服务器...
    npm run preview
    goto end
)
if "%choice%"=="3" (
    echo 构建兼容性版本并启动预览服务器...
    npm run build:compat
    echo 预览服务器启动中...
    npm run preview
    goto end
)
if "%choice%"=="4" (
    echo 构建兼容性版本...
    npm run build:compat
    echo 构建完成！文件位于 dist/ 目录
    echo 使用 'npm run preview' 启动预览服务器
    pause
    goto end
)
if "%choice%"=="5" (
    exit
)
echo 无效选择，使用默认启动开发服务器...
npm run dev

:end
pause