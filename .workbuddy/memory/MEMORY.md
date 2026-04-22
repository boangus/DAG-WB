# MEMORY.md

## 项目概览

### DAG-WB 项目
- **位置**: `D:\research\Baidusyncdisk\project_Npublic\Methodology\DAG\weibsite2`
- **GitHub**: https://github.com/boangus/DAG-WB
- **在线访问**: https://boangus.github.io/DAG-WB
- **状态**: GitHub Pages已部署

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
1. 验证GitHub Pages可访问
2. 继续开发dag-builder分支（DAG绘制Agent）
</parameter>
