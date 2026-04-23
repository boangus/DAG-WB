# MEMORY.md

## 项目概览

### DAG-WB 项目
- **位置**: `D:\research\Baidusyncdisk\project_Npublic\Methodology\DAG\weibsite2`
- **GitHub**: https://github.com/boangus/DAG-WB
- **在线访问**: https://boangus.github.io/DAG-WB
- **状态**: GitHub Pages已部署 (v3.1)
- **最新提交**: 7a912d9 - dagitty风格交互功能

### 核心功能 (v3.1)
- **dagitty风格交互**：
  - 点击画布空白 → 添加变量（弹出输入框）
  - 点击节点A → 点击节点B → 创建有向边
  - 创建边时选择显示/隐藏标签
  - 点击边切换标签显示
  - 双击节点快速重命名
- **快捷键**：E暴露/O结局/A混杂/U未测/M中介/I工具/P代理/X修饰/S选择/R重命名/D删除
- **自动布局**：dagre LR布局
- **因果推断**：基于Quimpo 2026方法学的连线类型推断

### 已删除的敏感文件
- Quimpo 2026 PDF（已从Git历史删除）
- 综述神器n8n流程文件（已从Git历史删除）

## 分支状态

| 分支 | 功能 | 状态 |
|------|------|------|
| main | 基础DAG绘图平台 | ✅ 已部署 |
| review-agent | 文献综述Agent | ✅ 基础完成 |
| dag-builder | DAG绘制Agent | 📋 待开发 |
| quality-evaluator | 质量评估Agent | 📋 待开发 |
| report-generator | 报告生成 | 📋 待开发 |

## 技术栈
- React 18 + Vite
- @xyflow/react (React Flow)
- TailwindCSS
- GitHub Actions → GitHub Pages

## 方法学依据
Quimpo & Steiner (2026) - Drawing credible DAG for causal inference

## 开发流程
1. 本地开发 → 推送分支 → GitHub Actions自动部署
2. 敏感文件：PDF/n8n流程 → 本地管理，不上传Git
3. .gitignore已配置保护

## 下一步
1. 继续开发dag-builder分支（DAG绘制Agent）
2. 完善review-agent文献综述功能
</parameter>
