import React, { useState } from 'react'

export function ExportPanel({ nodes, edges, onClose }) {
  const [format, setFormat] = useState('dagitty')

  const generateDagittyCode = () => {
    const nodeList = nodes.map((n) => {
      const label = n.data.label || n.id
      const exposure = n.data.type === 'exposure' ? ' [exposure]' : ''
      const outcome = n.data.type === 'outcome' ? ' [outcome]' : ''
      const adjusted = ['confounder', 'mediator', 'effect-modifier'].includes(n.data.type) ? ' [adjusted]' : ''
      return `    ${n.id} [label="${label}"${exposure}${outcome}${adjusted}]`
    }).join('\n')

    const edgeList = edges.map((e) => {
      const arrow = e.data?.arrowType === 'bidirectional' ? '<->' : '->'
      return `    ${e.source} ${arrow} ${e.target}`
    }).join('\n')

    return `dag {\n${nodeList}\n${edgeList}\n}`
  }

  const generateObsidianMarkdown = () => {
    const nodesList = nodes.map((n) => {
      const desc = n.data.description ? `\n  - 说明: ${n.data.description}` : ''
      return `- **${n.data.label}** (${n.data.type || '未知'})${desc}`
    }).join('\n')

    const edgesList = edges.map((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source)
      const targetNode = nodes.find((n) => n.id === e.target)
      return `- ${sourceNode?.data.label || e.source} → ${targetNode?.data.label || e.target}`
    }).join('\n')

    return `# DAG 图谱报告

## 节点 (${nodes.length})

${nodesList}

## 边 (${edges.length})

${edgesList}

## Dagitty 代码

\`\`\`dagitty
${generateDagittyCode()}
\`\`\`

---
*由 DAG-WB 有向无环图绘制平台 生成*
`
  }

  const handleExport = () => {
    let content, filename, mimeType

    if (format === 'dagitty') {
      content = generateDagittyCode()
      filename = 'dag.txt'
      mimeType = 'text/plain'
    } else if (format === 'json') {
      content = JSON.stringify({ nodes, edges }, null, 2)
      filename = 'dag.json'
      mimeType = 'application/json'
    } else if (format === 'obsidian') {
      content = generateObsidianMarkdown()
      filename = 'dag-report.md'
      mimeType = 'text/markdown'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const dagittyCode = generateDagittyCode()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-medium text-slate-800 dark:text-white">导出 DAG 图</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Format Selection */}
          <div className="mb-4">
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
              导出格式
            </label>
            <div className="flex gap-2">
              {[
                { id: 'dagitty', label: '📊 Dagitty 代码' },
                { id: 'json', label: '📋 JSON 数据' },
                { id: 'obsidian', label: '📝 Obsidian 报告' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    format === f.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
              预览
            </label>
            <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-xs overflow-x-auto max-h-64 border border-slate-200 dark:border-slate-700">
              {format === 'dagitty' ? dagittyCode :
               format === 'json' ? JSON.stringify({ nodes, edges }, null, 2) :
               generateObsidianMarkdown()}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
          >
            下载
          </button>
        </div>
      </div>
    </div>
  )
}
