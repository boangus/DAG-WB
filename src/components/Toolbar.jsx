import React, { useState } from 'react'

const westernVariables = [
  { role: 'exposure',        label: '暴露 ☀️',     icon: '☀️' },
  { role: 'outcome',          label: '结局 🎯',     icon: '🎯' },
  { role: 'confounder',       label: '混杂 🔀',     icon: '🔀' },
  { role: 'mediator',         label: '中介 🔄',     icon: '🔄' },
  { role: 'effect_modifier',  label: '效应修饰 ⚡', icon: '⚡' },
  { role: 'instrument',       label: '工具变量 🔧', icon: '🔧' },
  { role: 'proxy',            label: '代理变量 📎', icon: '📎' },
  { role: 'unobserved',      label: '未测变量 ❓', icon: '❓' },
]

const tcmVariables = [
  { role: 'pathogen',        label: '病位 📍',     icon: '📍' },
  { role: 'syndrome',        label: '证素 🧭',     icon: '🧭' },
  { role: 'symptom',          label: '症状 📋',     icon: '📋' },
  { role: 'constitution',    label: '体质 🧬',    icon: '🧬' },
  { role: 'external-factor', label: '外邪 🌪️',     icon: '🌪️' },
  { role: 'internal-factor',  label: '内伤 💝',     icon: '💝' },
  { role: 'confounder',       label: '病因要素 🔀', icon: '🔀' },
]

const getNodeStyle = (role, nodeColors) => {
  const c = nodeColors[role] || nodeColors.other
  return {
    background: c.bg,
    border: `2px ${c.dashed ? 'dashed' : 'solid'} ${c.border}`,
    borderRadius: '8px',
    color: c.text,
  }
}

export function Toolbar({ mode, onAddNode, onClear, nodeColors }) {
  const [confirming, setConfirming] = useState(false)
  const variables = mode === 'western' ? westernVariables : tcmVariables

  const handleAdd = (v) => {
    // Position is handled by auto-layout (0,0 = placeholder)
    onAddNode({
      position: { x: 0, y: 0 },
      data: { label: v.label, role: v.role },
    })
  }

  return (
    <aside className="w-56 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 overflow-y-auto shrink-0 flex flex-col gap-3">

      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
          {mode === 'western' ? '🏥 添加变量节点' : '🏯 添加中医变量'}
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          {variables.map((v) => (
            <button
              key={v.role}
              onClick={() => handleAdd(v)}
              className="flex flex-col items-center p-2 transition-all hover:scale-105 hover:shadow-md"
              style={getNodeStyle(v.role, nodeColors)}
              title={`添加${v.label}`}
            >
              <span className="text-base">{v.icon}</span>
              <span className="text-[11px] font-medium mt-0.5">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200 dark:border-slate-700" />

      {/* Edge Type Legend */}
      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">➡️ 边类型（图例）</p>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="13" y2="5" stroke="#2563eb" strokeWidth="2" markerEnd="url(#arr-blue)"/><defs><marker id="arr-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#2563eb"/></marker></defs></svg>
            <span>暴露→结局：直接效应</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="13" y2="5" stroke="#7c3aed" strokeWidth="2"/><path d="M10,2 L14,5 L10,8" fill="none" stroke="#7c3aed" strokeWidth="1.5"/></svg>
            <span>混杂→任意：混杂</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="5" x2="13" y2="5" stroke="#059669" strokeWidth="2"/><path d="M10,2 L14,5 L10,8" fill="none" stroke="#059669" strokeWidth="1.5"/></svg>
            <span>暴露→中介→结局：中介</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="16" height="10" viewBox="0 0 16 10"><line x1="1" y1="2" x2="8" y2="5" stroke="#d97706" strokeWidth="2"/><line x1="13" y1="8" x2="8" y2="5" stroke="#d97706" strokeWidth="2"/><path d="M6,3 L9,5 L6,7" fill="none" stroke="#d97706" strokeWidth="1.5"/></svg>
            <span>多入→节点：碰撞</span>
          </div>
        </div>
      </div>

      <hr className="border-slate-200 dark:border-slate-700" />

      {/* Clear canvas */}
      {confirming ? (
        <div className="space-y-1.5">
          <p className="text-xs text-red-500">确定清空画布？</p>
          <div className="flex gap-1.5">
            <button onClick={() => { onClear(); setConfirming(false) }}
              className="flex-1 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600">
              确定
            </button>
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-600 rounded text-xs">
              取消
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)}
          className="w-full py-1.5 text-xs text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-600 rounded transition-colors">
          🗑️ 清空画布
        </button>
      )}

      {/* Tips */}
      <div className="mt-auto p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">💡 使用提示</p>
        <ul className="space-y-0.5">
          <li>• 点击按钮添加变量</li>
          <li>• 拖拽节点边缘连线</li>
          <li>• 连线时自动判断边类型</li>
          <li>• ⚡ 自动布局整理图形</li>
          <li>• 点击节点编辑角色</li>
        </ul>
      </div>
    </aside>
  )
}
