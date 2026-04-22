import React, { useState } from 'react'

const TCM_SEARCH_TEMPLATES = {
  '黄帝内经': '("Huangdi Neijing" OR "Yellow Emperor" OR "Suwen" OR "Lingshu")',
  '伤寒论': '("Shanghan Lun" OR "Treatise on Cold Damage" OR "Zhang Zhongjing")',
  '金匮要略': '("Jingui Yaolue" OR "Essential Prescriptions")',
  '诸病源候论': '("Zhubing Yuanhou Lun" OR "General Treatise on Causes")',
  '温病条辨': '("Wenbing Tiaobian" OR "Warm Disease")',
}

const COMMON_TCM_VARIABLES = [
  { term: '肾虚', eng: 'kidney deficiency' },
  { term: '气虚', eng: 'qi deficiency' },
  { term: '血瘀', eng: 'blood stasis' },
  { term: '湿热', eng: 'damp-heat' },
  { term: '痰浊', eng: 'phlegm turbidity' },
  { term: '肝郁', eng: 'liver depression' },
  { term: '脾虚', eng: 'spleen deficiency' },
]

export function PubMedSearch({ mode, onSearch }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [searchType, setSearchType] = useState('free')

  const buildQuery = () => {
    if (searchType === 'free') return query

    // Build structured query
    const conditions = query.split(',').map((c) => c.trim()).filter(Boolean)
    if (conditions.length === 0) return query

    let q = ''
    if (mode === 'western') {
      q = conditions.map((c) => `("${c}"[Title/Abstract])`).join(' AND ')
    } else {
      // TCM mode - include both Chinese and English terms
      const tcmTerms = COMMON_TCM_VARIABLES.filter((v) =>
        conditions.some((c) => v.term.includes(c) || v.eng.includes(c.toLowerCase()))
      )
      const queries = conditions.flatMap((c) => [
        `("${c}"[Title/Abstract]`,
        ...(tcmTerms.find((t) => t.term === c || t.eng === c.toLowerCase())
          ? [TCM_SEARCH_TEMPLATES[c] || '']
          : []),
      ])
      q = queries.filter(Boolean).join(' AND ')
    }
    return q || query
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)

    try {
      const searchQuery = buildQuery()
      const encodedQuery = encodeURIComponent(searchQuery)
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedQuery}&retmax=50&retmode=json&sort=relevance`

      const res = await fetch(url)
      const data = await res.json()

      if (data.esearchresult?.idlist?.length > 0) {
        const ids = data.esearchresult.idlist.slice(0, 20)
        await fetchArticleDetails(ids)
      } else {
        setResults([])
      }
    } catch (err) {
      setError('检索失败，请重试')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchArticleDetails = async (ids) => {
    const idsStr = ids.join(',')
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${idsStr}&rettype=abstract&retmode=text`

    try {
      const res = await fetch(url)
      const text = await res.text()
      // Parse PubMed text format
      const articles = parsePubMedText(text, ids)
      setResults(articles)
    } catch (err) {
      setError('获取摘要失败')
      console.error(err)
    }
  }

  const parsePubMedText = (text, ids) => {
    // Simple parsing - in production would use XML or more robust parsing
    const articles = text.split(/\n\n(?=\d+\.\s)/)
    return articles.map((block, i) => {
      const lines = block.split('\n').filter(Boolean)
      const id = ids[i] || `temp-${i}`
      const title = lines[0]?.replace(/^\d+\.\s*/, '') || '无标题'
      const abstractMatch = block.match(/^(?:Abstract|摘要)[:\s]*(.*)/is)
      const abstract = abstractMatch?.[1] || ''
      const authorsMatch = block.match(/Authors?[:\s]*(.*?)(?:\n|$)/i)
      const authors = authorsMatch?.[1] || ''
      return {
        id,
        pmid: id,
        title,
        abstract,
        authors,
        selected: false,
      }
    }).filter((a) => a.title && a.title !== '无标题')
  }

  const toggleArticle = (id) => {
    setResults((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, selected: !a.selected } : a
      )
    )
  }

  const handleContinue = () => {
    const selected = results.filter((r) => r.selected)
    if (selected.length === 0) {
      setError('请至少选择一篇文章')
      return
    }
    onSearch(selected)
  }

  const selectAll = () => {
    setResults((prev) => prev.map((a) => ({ ...a, selected: true })))
  }

  const selectNone = () => {
    setResults((prev) => prev.map((a) => ({ ...a, selected: false })))
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <span>🔍</span>
          {mode === 'western' ? 'PubMed 文献检索' : '中西医文献检索'}
        </h3>

        {/* Search Type Toggle */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSearchType('free')}
            className={`px-3 py-1 rounded text-sm ${
              searchType === 'free'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700'
            }`}
          >
            自由检索
          </button>
          <button
            onClick={() => setSearchType('structured')}
            className={`px-3 py-1 rounded text-sm ${
              searchType === 'structured'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700'
            }`}
          >
            结构化检索
          </button>
        </div>

        {/* Query Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={
              mode === 'western'
                ? '输入关键词，如: acupuncture prostate cancer VMS...'
                : '输入中医证候/病名，如: 肾虚, 气虚, 血瘀...'
            }
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? '检索中...' : '检索'}
          </button>
        </div>

        {mode === 'tcm' && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-700 dark:text-amber-300">
            💡 提示：中医模式会自动匹配相关古籍文献和现代研究证据
          </div>
        )}
      </div>

      {/* Results */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              找到 {results.length} 篇文献，已选择 {results.filter((r) => r.selected).length} 篇
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-blue-500 hover:underline"
              >
                全选
              </button>
              <button
                onClick={selectNone}
                className="text-xs text-slate-500 hover:underline"
              >
                取消
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((article) => (
              <div
                key={article.id}
                onClick={() => toggleArticle(article.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  article.selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
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
                    <p className="text-xs text-slate-500 mt-1">
                      PMID: {article.pmid}
                      {article.authors && ` • ${article.authors.slice(0, 50)}...`}
                    </p>
                    {article.abstract && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {article.abstract.slice(0, 200)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleContinue}
            className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            继续 ({results.filter((r) => r.selected).length} 篇已选)
          </button>
        </>
      )}

      {results.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-2">📚</p>
          <p>输入关键词开始检索 PubMed 文献</p>
        </div>
      )}
    </div>
  )
}
