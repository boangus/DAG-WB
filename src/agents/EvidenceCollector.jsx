import React, { useState } from 'react'

export function EvidenceCollector({ results, mode, onSelect }) {
  const [articles, setArticles] = useState(results)
  const [sortBy, setSortBy] = useState('relevance')

  const toggleArticle = (id) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, selected: !a.selected } : a
      )
    )
  }

  const selectAll = () => {
    setArticles((prev) => prev.map((a) => ({ ...a, selected: true })))
  }

  const selectNone = () => {
    setArticles((prev) => prev.map((a) => ({ ...a, selected: false })))
  }

  const selectTop = (n = 10) => {
    setArticles((prev) =>
      prev.map((a, i) => ({ ...a, selected: i < n }))
    )
  }

  const handleContinue = () => {
    const selected = articles.filter((a) => a.selected)
    if (selected.length === 0) return
    onSelect(selected)
  }

  const sorted = [...articles].sort((a, b) => {
    if (sortBy === 'relevance') {
      return b.selected ? 1 : -1
    }
    return 0
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          📚 选择用于DAG的文献证据 ({articles.length} 篇)
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">排序：</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded px-2 py-1"
          >
            <option value="relevance">相关性</option>
            <option value="pmid">PMID</option>
          </select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={selectAll}
          className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          全选
        </button>
        <button
          onClick={selectNone}
          className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          取消
        </button>
        <button
          onClick={() => selectTop(10)}
          className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
        >
          选前10篇
        </button>
        <button
          onClick={() => selectTop(20)}
          className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
        >
          选前20篇
        </button>
      </div>

      {/* Selected Count */}
      <div className="text-sm text-slate-600 dark:text-slate-300">
        已选择 {articles.filter((a) => a.selected).length} 篇文献
      </div>

      {/* Articles List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {sorted.map((article) => (
          <div
            key={article.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              article.selected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onClick={() => toggleArticle(article.id)}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={article.selected}
                onChange={() => toggleArticle(article.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2">
                  {article.title}
                </h4>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>PMID: {article.pmid}</span>
                  {article.authors && (
                    <span className="truncate">
                      {article.authors.slice(0, 60)}
                    </span>
                  )}
                </div>
                {article.abstract && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                    {article.abstract}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={articles.filter((a) => a.selected).length === 0}
        className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        继续 ({articles.filter((a) => a.selected).length} 篇已选)
      </button>
    </div>
  )
}
