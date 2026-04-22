@echo off
REM DAG-WB Git 初始化脚本
REM 在本地执行此脚本以初始化Git仓库并连接远程仓库

echo 正在初始化Git仓库...

cd /d "%~dp0"

REM 初始化Git仓库
git init

REM 添加所有文件
git add .

REM 初始提交
git commit -m "feat: 初始化DAG-WB基础平台

- React + Vite + TailwindCSS
- React Flow DAG画布
- 双模式支持(西医/中医)
- 基础节点编辑功能
- 导出功能(Dagitty/JSON/Obsidian)"

REM 添加远程仓库（如果需要手动添加，请取消下面这行的注释）
REM git remote add origin https://github.com/boangus/DAG-WB.git

echo.
echo Git仓库初始化完成！
echo.
echo 接下来你可以：
echo 1. 手动在GitHub上创建仓库
echo 2. 运行: git remote add origin https://github.com/boangus/DAG-WB.git
echo 3. 运行: git push -u origin main
echo.
echo 如需创建功能分支，运行:
echo   git checkout -b review-agent
echo   git checkout -b dag-builder
echo   git checkout -b quality-evaluator
echo   git checkout -b report-generator
echo.
pause
