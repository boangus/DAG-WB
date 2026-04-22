import React, { useState } from 'react'

const TCM_CLASSICS = [
  {
    id: 'huangdi',
    name: '黄帝内经',
    dynasty: '战国-西汉',
    keyConcepts: ['阴阳', '五行', '脏腑', '经络', '病机', '证候'],
    description: '现存最早的中医理论典籍确立了辨证论治原则',
  },
  {
    id: 'shanghan',
    name: '伤寒论',
    dynasty: '东汉',
    keyConcepts: ['六经辨证', '方证对应', '桂枝汤', '麻黄汤'],
    description: '外感病辨证论治的典范，奠定方剂学基础',
  },
  {
    id: 'jingui',
    name: '金匮要略',
    dynasty: '东汉',
    keyConcepts: ['杂病', '辨证论治', '脏腑经络', '痰饮', '水气'],
    description: '内科杂病辨证论治的奠基之作',
  },
  {
    id: 'zhubing',
    name: '诸病源候论',
    dynasty: '隋',
    keyConcepts: ['病因学', '病机', '证候', '养生', '导引'],
    description: '第一部病因病机学专著，系统阐述病因学说',
  },
  {
    id: 'wenbing',
    name: '温病条辨',
    dynasty: '清',
    keyConcepts: ['温病学', '卫气营血', '三焦辨证', '清热解毒'],
    description: '温病学集大成之作，完善辨证体系',
  },
]

const COMMON_SYNDROMES = [
  { name: '肾虚', pinyin: 'Shen Xu', category: '虚证', description: '肾脏精气不足' },
  { name: '气虚', pinyin: 'Qi Xu', category: '虚证', description: '元气不足' },
  { name: '血瘀', pinyin: 'Xue Yu', category: '实证', description: '血液运行不畅' },
  { name: '湿热', pinyin: 'Shi Re', category: '实证', description: '湿热内蕴' },
  { name: '痰浊', pinyin: 'Tan Zhuo', category: '实证', description: '痰湿壅盛' },
  { name: '肝郁', pinyin: 'Gan Yu', category: '实证', description: '肝气郁结' },
  { name: '脾虚', pinyin: 'Pi Xu', category: '虚证', description: '脾胃虚弱' },
  { name: '心悸', pinyin: 'Xin Ji', category: '证候', description: '心跳异常' },
]

const PATHOLOGY_LOCATIONS = [
  { name: '肾', pinyin: 'Kidney', organs: ['膀胱', '骨', '耳'] },
  { name: '肝', pinyin: 'Liver', organs: ['胆', '筋', '目'] },
  { name: '脾', pinyin: 'Spleen', organs: ['胃', '肌肉', '口'] },
  { name: '肺', pinyin: 'Lung', organs: ['大肠', '皮毛', '鼻'] },
  { name: '心', pinyin: 'Heart', organs: ['小肠', '脉', '舌'] },
]

export function TCMKnowledge({ selectedArticles = [], onCollect }) {
  const [step, setStep] = useState(1)
  const [selectedClassics, setSelectedClassics] = useState([])
  const [selectedSyndromes, setSelectedSyndromes] = useState([])
  const [selectedLocations, setSelectedLocations] = useState([])
  const [customEvidence, setCustomEvidence] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleClassic = (id) => {
    setSelectedClassics((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleSyndrome = (name) => {
    setSelectedSyndromes((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    )
  }

  const toggleLocation = (name) => {
    setSelectedLocations((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    )
  }

  const handleExtractEvidence = async () => {
    setLoading(true)

    // Simulate evidence extraction from TCM knowledge base
    await new Promise((r) => setTimeout(r, 1000))

    const evidence = [
      ...selectedClassics.map((id) => {
        const classic = TCM_CLASSICS.find((c) => c.id === id)
        return {
          id: `classic-${id}`,
          type: 'classical_text',
          source: classic.name,
          concepts: classic.keyConcepts,
          relevance: 'high',
        }
      }),
      ...selectedSyndromes.map((name) => {
        const syndrome = COMMON_SYNDROMES.find((s) => s.name === name)
        return {
          id: `syndrome-${name}`,
          type: 'syndrome',
          source: syndrome.name,
          category: syndrome.category,
          description: syndrome.description,
          relevance: 'high',
        }
      }),
      ...selectedLocations.map((name) => {
        const location = PATHOLOGY_LOCATIONS.find((l) => l.name === name)
        return {
          id: `location-${name}`,
          type: 'pathology_location',
          source: location.name,
          relatedOrgans: location.organs,
          relevance: 'medium',
        }
      }),
    ]

    setLoading(false)
    onCollect(evidence)
  }

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">
          🏯 中医古籍证据收集
        </h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-300">
          从中医经典中提取病位、证素等变量，构建中医DAG的理论基础
        </p>
      </div>

      {/* Step 1: Select Classics */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">1</span>
          选择相关古籍
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {TCM_CLASSICS.map((classic) => (
            <button
              key={classic.id}
              onClick={() => toggleClassic(classic.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedClassics.includes(classic.id)
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <div className="font-medium text-sm">{classic.name}</div>
              <div className="text-xs text-slate-500">{classic.dynasty}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                {classic.keyConcepts.slice(0, 3).join(', ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Syndromes */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">2</span>
          选择证素
        </h4>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYNDROMES.map((syndrome) => (
            <button
              key={syndrome.name}
              onClick={() => toggleSyndrome(syndrome.name)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedSyndromes.includes(syndrome.name)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              {syndrome.name}
              <span className="ml-1 text-xs opacity-70">({syndrome.category})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Select Pathology Locations */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">3</span>
          选择病位
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {PATHOLOGY_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => toggleLocation(loc.name)}
              className={`p-2 rounded border text-center transition-colors ${
                selectedLocations.includes(loc.name)
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <div className="font-medium">{loc.name}</div>
              <div className="text-xs text-slate-500">{loc.pinyin}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Evidence */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-400 text-white text-xs flex items-center justify-center">?</span>
          自定义证据 (可选)
        </h4>
        <textarea
          value={customEvidence}
          onChange={(e) => setCustomEvidence(e.target.value)}
          placeholder="输入任何古籍引文或自定义证据..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm resize-none"
        />
      </div>

      {/* Extract Button */}
      <button
        onClick={handleExtractEvidence}
        disabled={loading || (selectedClassics.length === 0 && selectedSyndromes.length === 0 && selectedLocations.length === 0)}
        className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
      >
        {loading ? '提取中...' : '📋 提取中医证据'}
      </button>

      {/* Summary */}
      {(selectedClassics.length > 0 || selectedSyndromes.length > 0 || selectedLocations.length > 0) && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm">
          <div className="font-medium mb-1">已选择：</div>
          <div className="flex flex-wrap gap-1">
            {selectedClassics.map((id) => {
              const c = TCM_CLASSICS.find((x) => x.id === id)
              return (
                <span key={id} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-xs">
                  {c?.name}
                </span>
              )
            })}
            {selectedSyndromes.map((name) => (
              <span key={name} className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs">
                {name}
              </span>
            ))}
            {selectedLocations.map((name) => (
              <span key={name} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
