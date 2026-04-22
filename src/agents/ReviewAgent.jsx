import React, { useState } from 'react'
import { PubMedSearch } from './PubMedSearch'
import { TCMKnowledge } from './TCMKnowledge'
import { EvidenceCollector } from './EvidenceCollector'
import { EvidenceSummary } from './EvidenceSummary'

export function ReviewAgent({ onExportEvidence, mode = 'western' }) {
  const [step, setStep] = useState(1)
  const [searchResults, setSearchResults] = useState([])
  const [selectedArticles, setSelectedArticles] = useState([])
  const [tcmEvidence, setTcmEvidence] = useState([])
  const [extractedVariables, setExtractedVariables] = useState([])

  const handlePubMedSearch = (results) => {
    setSearchResults(results)
    setStep(2)
  }

  const handleArticleSelect = (articles) => {
    setSelectedArticles(articles)
    setStep(3)
  }

  const handleTCMEvidence = (evidence) => {
    setTcmEvidence(evidence)
    setStep(4)
  }

  const handleVariablesExtracted = (variables) => {
    setExtractedVariables(variables)
    if (onExportEvidence) {
      onExportEvidence({
        articles: selectedArticles,
        tcmEvidence,
        variables,
        mode,
      })
    }
    setStep(5)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {[
          { num: 1, label: '文献检索' },
          { num: 2, label: '文献筛选' },
          { num: 3, label: '中医证据' },
          { num: 4, label: '变量提取' },
          { num: 5, label: '完成' },
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            {i > 0 && (
              <span className="text-slate-300 dark:text-slate-600">›</span>
            )}
            <button
              onClick={() => s.num < step && setStep(s.num)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
                step === s.num
                  ? 'bg-blue-500 text-white'
                  : s.num < step
                  ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                step === s.num
                  ? 'bg-white text-blue-500'
                  : s.num < step
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-600'
              }`}>
                {s.num}
              </span>
              {s.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {step === 1 && (
          <PubMedSearch
            mode={mode}
            onSearch={handlePubMedSearch}
          />
        )}
        {step === 2 && (
          <EvidenceCollector
            results={searchResults}
            mode={mode}
            onSelect={handleArticleSelect}
          />
        )}
        {step === 3 && mode === 'tcm' && (
          <TCMKnowledge
            selectedArticles={selectedArticles}
            onCollect={handleTCMEvidence}
          />
        )}
        {step === 3 && mode === 'western' && (
          <VariableExtractor
            articles={selectedArticles}
            onExtract={handleVariablesExtracted}
          />
        )}
        {(step === 4 || (step === 3 && mode === 'tcm')) && (
          <VariableExtractor
            articles={selectedArticles}
            tcmEvidence={tcmEvidence}
            mode={mode}
            onExtract={handleVariablesExtracted}
          />
        )}
        {step === 5 && (
          <EvidenceSummary
            articles={selectedArticles}
            tcmEvidence={tcmEvidence}
            variables={extractedVariables}
            onReset={() => setStep(1)}
          />
        )}
      </div>
    </div>
  )
}

// Variable Extractor Component
function VariableExtractor({ articles, tcmEvidence = [], mode, onExtract }) {
  const [variables, setVariables] = useState([])
  const [loading, setLoading] = useState(false)

  const handleExtract = async () => {
    setLoading(true)
    // Simulate variable extraction from evidence
    await new Promise((r) => setTimeout(r, 1000))
    const extracted = [
      ...articles.map((a) => ({
        name: a.variableName || a.title?.slice(0, 30),
        type: mode === 'western' ? 'exposure' : 'pathogen',
        source: 'pubmed',
        articleId: a.id,
      })),
      ...tcmEvidence.map((e) => ({
        name: e.variableName || e.concept,
        type: 'syndrome',
        source: 'tcm',
        textId: e.id,
      })),
    ]
    setVariables(extracted)
    setLoading(false)
    onExtract(extracted)
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          📋 从证据中提取变量
        </h3>
        <p className="text-sm text-blue-600 dark:text-blue-300">
          {mode === 'western'
            ? '从PubMed检索到的文献中提取关键变量，用于构建DAG'
            : '从中医古籍和文献中提取病位、证素等变量'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="font-medium mb-2">已收集的证据</h4>
        <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
          <li>📚 PubMed文献: {articles.length} 篇</li>
          {tcmEvidence.length > 0 && (
            <li>🏯 中医证据: {tcmEvidence.length} 条</li>
          )}
        </ul>
      </div>

      <button
        onClick={handleExtract}
        disabled={loading || articles.length === 0}
        className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '正在提取变量...' : '🔍 提取变量'}
      </button>

      {variables.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="font-medium mb-2">已提取的变量 ({variables.length})</h4>
          <div className="flex flex-wrap gap-2">
            {variables.map((v, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-sm"
              >
                {v.name} ({v.type})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
