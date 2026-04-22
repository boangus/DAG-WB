import React, { useState } from 'react'

const westernVariables = [
  { type: 'exposure', label: '暴露因素', icon: '☀️', role: 'exposure' },
  { type: 'outcome', label: '结局', icon: '🎯', role: 'outcome' },
  { type: 'confounder', label: '混杂因素', icon: '🔀', role: 'confounder' },
  { type: 'mediator', label: '中介因素', icon: '🔄', role: 'mediator' },
  { type: 'effect-modifier', label: '效应修饰', icon: '⚡', role: 'effect_modifier' },
  { type: 'instrument', label: '工具变量', icon: '🔧', role: 'instrument' },
  { type: 'proxy', label: '代理变量', icon: '📎', role: 'proxy' },
  { type: 'unobserved', label: '未测变量', icon: '❓', role: 'unobserved' },
]

const tcmVariables = [
  { type: 'pathogen', label: '病位', icon: '📍', role: 'pathogen' },
  { type: 'syndrome', label: '证素', icon: '🧭', role: 'syndrome' },
  { type: 'symptom', label: '症状', icon: '📋', role: 'symptom' },
  { type: 'constitution', label: '体质', icon: '🧬', role: 'constitution' },
  { type: 'external-factor', label: '外邪', icon: '🌪️', role: 'external-factor' },
  { type: 'internal-factor', label: '内伤', icon: '💝', role: 'internal-factor' },
  { type: 'TCM-confounder', label: '病因要素', icon: '🔀', role: 'confounder' },
]

const getNodeStyle = (role, nodeColors) => {
  const colors = nodeColors[role] || nodeColors.other
  return {
    background: colors.bg,
    border: `2px ${colors.dashed ? 'dashed' : 'solid'} ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }
}

export function Toolbar({ mode, onAddNode, onClear, nodeColors }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const variables = mode === 'western' ? westernVariables : tcmVariables

  const handleAdd = (v) => {
    const id = `${v.type}-${Date.now()}`
    const offsetX = Math.random() * 60 - 30
    onAddNode({
      id,
      position: { x: 0, y: 0 }, // Will be auto-layouted
      data: { label: v.label, role: v.role, icon: v.icon },
    })
  }

  const handleClear = () => {
    onClear()
    setShowClearConfirm(false)
  }

  return (
    <aside className="w-56 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 overflow-y-auto shrink-0">
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
        {mode === 'western' ? '🏥 添加变量节点' : '🏯 添加中医变量'}
      </h2>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {variables.map((v) => {
          const style = getNodeStyle(v.role, nodeColors)
          return (
            <button
              key={v.type}
              onClick={() => handleAdd(v)}
              className="flex flex-col items-center p-2 transition-all hover:scale-105"
              style={style}
              title={v.label}
            >
              <span className="text-lg">{v.icon}</span>
              <span className="text-xs mt-1 font-medium">{v.label}</span>
            </button>
          )
        })}
      </div>

      <hr className="border-slate-200 dark:border-slate-700 my-3" />

      {showClearConfirm ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400">确定清空画布？</p>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              确定
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-600 rounded text-sm"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full px-3 py-1.5 text-sm text-slate-500 hover:text-red-500 border border-slate-200 dark:border-slate-600 rounded transition-colors"
        >
          🗑️ 清空画布
        </button>
      )}

      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs text-slate-500 dark:text-slate-400">
        <p className="font-medium mb-2">💡 使用提示：</p>
        <ul className="space-y-1">
          <li>• 点击添加变量节点</li>
          <li>• 拖拽节点边缘连接 = 添加因果箭头</li>
          <li>• 点击节点查看详情</li>
          <li>• 使用⚡自动布局整理</li>
          {mode === 'tcm' && (
            <>
              <li>• 病位+证素构建DAG</li>
              <li>• 参考《黄帝内经》方法</li>
            </>
          )}
        </ul>
      </div>

      {/* Edge Type Legend */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs text-slate-500 dark:text-slate-400">
        <p className="font-medium mb-2">➡️ 箭头类型：</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-1">
            <span style={{ color: '#2563eb' }}>—▶</span> 直接效应
          </li>
          <li className="flex items-center gap-1">
            <span style={{ color: '#7c3aed' }}>—▶</span> 混杂
          </li>
          <li className="flex items-center gap-1">
            <span style={{ color: '#059669' }}>—▶</span> 中介
          </li>
          <li className="flex items-center gap-1">
            <span style={{ color: '#dc2626' }}>—▶</span> 偏倚路径
          </li>
        </ul>
      </div>
    </aside>
  )
}
