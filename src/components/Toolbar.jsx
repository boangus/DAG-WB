import React, { useState } from 'react'

const westernVariables = [
  { type: 'exposure', label: '暴露因素', icon: '☀️', color: '#fef3c7', border: '#f59e0b' },
  { type: 'outcome', label: '结局', icon: '🎯', color: '#dbeafe', border: '#3b82f6' },
  { type: 'confounder', label: '混杂因素', icon: '🔀', color: '#fce7f3', border: '#ec4899' },
  { type: 'mediator', label: '中介因素', icon: '🔄', color: '#d1fae5', border: '#10b981' },
  { type: 'effect-modifier', label: '效应修饰', icon: '⚡', color: '#e0e7ff', border: '#6366f1' },
  { type: 'collider', label: '对撞因子', icon: '💥', color: '#fef9c3', border: '#eab308' },
]

const tcmVariables = [
  { type: 'pathogen', label: '病位', icon: '📍', color: '#fef3c7', border: '#f59e0b' },
  { type: 'syndrome', label: '证素', icon: '🧭', color: '#dbeafe', border: '#3b82f6' },
  { type: 'symptom', label: '症状', icon: '📋', color: '#fce7f3', border: '#ec4899' },
  { type: 'constitution', label: '体质', icon: '🧬', color: '#d1fae5', border: '#10b981' },
  { type: 'external-factor', label: '外邪', icon: '🌪️', color: '#e0e7ff', border: '#6366f1' },
  { type: 'internal-factor', label: '内伤', icon: '💝', color: '#fef9c3', border: '#eab308' },
]

export function Toolbar({ mode, onAddNode, onClear }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const variables = mode === 'western' ? westernVariables : tcmVariables

  const handleAdd = (v) => {
    const id = `${v.type}-${Date.now()}`
    const offset = Math.random() * 100 - 50
    onAddNode({
      id,
      position: { x: 300 + offset, y: 200 + offset },
      data: { label: v.label, type: v.type, icon: v.icon },
      style: {
        background: v.color,
        border: `2px solid ${v.border}`,
      },
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
        {variables.map((v) => (
          <button
            key={v.type}
            onClick={() => handleAdd(v)}
            className="flex flex-col items-center p-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            style={{ borderColor: v.border, background: v.color }}
          >
            <span className="text-lg">{v.icon}</span>
            <span className="text-xs mt-1 text-slate-700 dark:text-slate-800">{v.label}</span>
          </button>
        ))}
      </div>

      <hr className="border-slate-200 dark:border-slate-700 my-3" />

      {showClearConfirm ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400">确定清空画布？</p>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded text-sm"
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
          className="w-full px-3 py-1.5 text-sm text-slate-500 hover:text-red-500 border border-slate-200 dark:border-slate-600 rounded"
        >
          🗑️ 清空画布
        </button>
      )}

      <div className="mt-4 p-2 bg-slate-50 dark:bg-slate-700 rounded text-xs text-slate-500 dark:text-slate-400">
        <p className="font-medium mb-1">💡 使用提示：</p>
        <ul className="space-y-0.5">
          <li>• 点击添加变量节点</li>
          <li>• 拖拽节点边缘连接</li>
          <li>• 点击节点查看详情</li>
          {mode === 'tcm' && (
            <>
              <li>• 病位+证素构建DAG</li>
              <li>• 参考《黄帝内经》</li>
            </>
          )}
        </ul>
      </div>
    </aside>
  )
}
