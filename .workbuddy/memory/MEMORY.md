# MEMORY.md

## 项目概览

### DAG-WB 项目
- **位置**: `D:\research\Baidusyncdisk\project_Npublic\Methodology\DAG\DAG-WB`
- **GitHub**: https://github.com/boangus/DAG-WB.git
- **状态**: 本地框架已创建，待GitHub连接

## 分支规划

| 分支 | 功能 | 状态 |
|------|------|------|
| main | 基础DAG绘图平台 | ✅ 框架完成 |
| review-agent | 文献综述Agent (PubMed+中医古籍) | 📋 待开发 |
| dag-builder | DAG绘制Agent (对话式引导) | 📋 待开发 |
| quality-evaluator | 质量评估Agent (六步法) | 📋 待开发 |
| report-generator | 报告生成 (Obsidian格式) | 📋 待开发 |

## 技术栈
- React 18 + Vite
- @xyflow/react (React Flow)
- TailwindCSS
- dagre

## 方法学依据
Quimpo & Steiner (2026) - Drawing credible directed acyclic graphs for causal inference

## 下一步行动
1. 运行 `init-git.bat` 初始化Git仓库
2. 手动在GitHub创建仓库并连接
3. 切换到各分支开发具体功能
