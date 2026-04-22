import React from 'react'

export function EvidenceSummary({ articles = [], tcmEvidence = [], variables = [], onReset }) {
  const handleExport = () => {
    const content = generateMarkdown()
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dag-evidence-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateMarkdown = () => {
    const date = new Date().toLocaleDateString('zh-CN')
    let md = `# DAG 文献综述报告

生成日期：${date}

## 文献证据 (${articles.length} 篇)

`

    articles.forEach((a, i) => {
      md += `### ${i + 1}. ${a.title}

- **PMID**: ${a.pmid}
- **作者**: ${a.authors || '未知'}
${a.abstract ? `- **摘要**: ${a.abstract.slice(0, 200)}...` : ''}

`
    })

    if (tcmEvidence.length > 0) {
      md += `## 中医证据 (${tcmEvidence.length} 条)

`
      tcmEvidence.forEach((e, i) => {
        md += `### ${i + 1}. ${e.source}

- **类型**: ${e.type}
- **相关概念**: ${e.concepts?.join(', ') || e.relatedOrgans?.join(', ') || '无'}
${e.description ? `- **描述**: ${e.description}` : ''}

`
      })
    }

    md += `## 提取的变量 (${variables.length} 个)

`
    const byType = {}
    variables.forEach((v) => {
      if (!byType[v.type]) byType[v.type] = []
      byType[v.type].push(v)
    })

    Object.entries(byType).forEach(([type, vars]) => {
      md += `### ${type} (${vars.length} 个)

`
      vars.forEach((v) => {
        md += `- **${v.name}** ${v.source ? `(来源: ${v.source})` : ''}\n`
      })
      md += '\n'
    })

    md += `---

*由 DAG-WB 文献综述Agent 生成*
`
    return md
  }

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">
          ✅ 文献综述完成！
        </h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-300">
          已收集 {articles.length} 篇文献和 {tcmEvidence.length} 条中医证据，提取了 {variables.length} 个变量
        </p>
      </div>

      {/* Variables Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="font-medium mb-3">📊 提取的变量</h4>
        <div className="flex flex-wrap gap-2">
          {variables.map((v, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm"
            >
              {v.name}
              <span className="ml-1 text-xs opacity-70">({v.type})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Evidence Preview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* PubMed Articles */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <span>📚</span> PubMed文献 ({articles.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {articles.slice(0, 5).map((a) => (
              <div key={a.id} className="text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                <div className="line-clamp-2">{a.title}</div>
                <div className="text-xs text-slate-500 mt-1">PMID: {a.pmid}</div>
              </div>
            ))}
            {articles.length > 5 && (
              <div className="text-xs text-slate-500">
                还有 {articles.length - 5} 篇...
              </div>
            )}
          </div>
        </div>

        {/* TCM Evidence */}
        {tcmEvidence.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <span>🏯</span> 中医证据 ({tcmEvidence.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tcmEvidence.slice(0, 5).map((e) => (
                <div key={e.id} className="text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                  <div>{e.source}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {e.type} • {e.concepts?.join(', ') || e.relatedOrgans?.join(', ') || '相关概念'}
                  </div>
                </div>
              ))}
              {tcmEvidence.length > 5 && (
                <div className="text-xs text-slate-500">
                  还有 {tcmEvidence.length - 5} 条...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          📥 导出证据报告
        </button>
        <button
          onClick={onReset}
          className="px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          🔄 新建综述
        </button>
      </div>
    </div>
  )
}
