# DAG-WB 有向无环图绘制平台

基于 [Dagitty](https://github.com/jtextor/dagitty) 的汉化增强版DAG绘图平台。

## 功能特性

### 核心功能
- 🎨 可视化DAG绘制（基于React Flow）
- 🌐 完全汉化界面
- 📊 支持Dagitty格式导入/导出
- 🌙 深色模式支持

### 双模式系统
- **🏥 西医模式**：暴露因素、结局、混杂因素、中介因素、效应修饰、对撞因子
- **🏯 中医模式**：病位、证素、症状、体质、外邪、内伤

### Agent系统（开发中）
- 📚 文献综述Agent（PubMed检索 + 中医古籍）
- 🎯 DAG绘制Agent（对话式引导）
- ✅ 质量评估Agent（六步法评估）

## 技术栈

- React 18 + Vite
- @xyflow/react (React Flow)
- TailwindCSS
- dagre (DAG布局算法)

## 开发计划

| 分支 | 功能 | 状态 |
|------|------|------|
| main | 基础DAG绘图平台 | 🚧 开发中 |
| review-agent | 文献综述Agent | 📋 待开发 |
| dag-builder | DAG绘制Agent | 📋 待开发 |
| quality-evaluator | 质量评估Agent | 📋 待开发 |
| report-generator | 报告生成 | 📋 待开发 |

## 开始使用

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 方法学参考

本项目参考Quimpo & Steiner (2026)的DAG绘制方法学：

> Drawing credible directed acyclic graphs for causal inference

### 六步法
1. 明确研究问题
2. 列出所有相关变量
3. 绘制因果路径
4. 识别混杂因素
5. 识别中介因素
6. 识别效应修饰

### Box 1. Key considerations for drawing causal graphs
- 完整性：是否遗漏重要变量
- 箭头省略合理性：是否有多余箭头
- 时间维度：变量时序关系
- 生物学合理性：路径是否符合已知机制

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT
