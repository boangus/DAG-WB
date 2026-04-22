import React, { useState } from 'react'

const westernRoles = [
  { value: 'exposure', label: '暴露因素 ☀️' },
  { value: 'outcome', label: '结局 🎯' },
  { value: 'confounder', label: '混杂因素 🔀' },
  { value: 'mediator', label: '中介因素 🔄' },
  { value: 'effect_modifier', label: '效应修饰 ⚡' },
  { value: 'instrument', label: '工具变量 🔧' },
  { value: 'mediator_collected', label: '中介(收集) 📤' },
  { value: 'proxy', label: '代理变量 📎' },
  { value: 'selection', label: '选择偏倚 📊' },
  { value: 'unobserved', label: '未测变量 ❓' },
  { value: 'other', label: '其他变量 📋' },
]

const tcmRoles = [
  { value: 'pathogen', label: '病位 📍' },
  { value: 'syndrome', label: '证素 🧭' },
  { value: 'symptom', label: '症状 📋' },
  { value: 'constitution', label: '体质 🧬' },
  { value: 'external-factor', label: '外邪 🌪️' },
  { value: 'internal-factor', label: '内伤 💝' },
  { value: 'confounder', label: '病因要素 🔀' },
  { value: 'mediator', label: '病机转化 🔄' },
  { value: 'unobserved', label: '未测变量 ❓' },
  { value: 'other', label: '其他 📋' },
]

export function NodeEditor({ node, mode, onUpdate, onDelete, onClose, nodeColors, edgeStyles }) {
  const [label, setLabel] = useState(node.data?.label || '')
  const [role, setRole] = useState(node.data?.role || 'other')
  const [description, setDescription] = useState(node.data?.description || '')
  const [evidence, setEvidence] = useState(node.data?.evidence || '')

  const roles = mode === 'western' ? westernRoles : tcmRoles
  const colors = nodeColors[role] || nodeColors.other

  const handleSave = () => {
    onUpdate({ label, role, description, evidence })
    onClose()
  }

  const previewStyle = {
    background: colors.bg,
    border: `2px ${colors.dashed ? 'dashed' : 'solid'} ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'inline-block',
  }

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-slate-800 dark:text-white">编辑节点</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg"
        >
          ✕
        </button>
      </div>

      {/* Preview */}
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">预览</p>
        <div style={previewStyle}>
          {label || '变量名称'}
        </div>
      </div>

      <div className="space-y-4">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            变量角色（DAGitty风格）
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            变量名称
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="输入变量名称"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            说明/定义
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述该变量的定义、来源或意义..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
          />
        </div>

        {/* Evidence Source */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            📚 证据来源
          </label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="引用文献、临床指南或专家共识..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
          />
        </div>

        {/* Role Color Guide */}
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs">
          <p className="font-medium text-slate-600 dark:text-slate-300 mb-2">🎨 角色颜色说明</p>
          <div className="grid grid-cols-2 gap-1 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: nodeColors.exposure?.bg, border: `1px solid ${nodeColors.exposure?.border}` }}></span>
              <span>暴露（因果起点）</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: nodeColors.outcome?.bg, border: `1px solid ${nodeColors.outcome?.border}` }}></span>
              <span>结局（因果终点）</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: nodeColors.confounder?.bg, border: `1px solid ${nodeColors.confounder?.border}` }}></span>
              <span>混杂（共同原因）</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: nodeColors.mediator?.bg, border: `1px solid ${nodeColors.mediator?.border}` }}></span>
              <span>中介（传导路径）</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: nodeColors.unobserved?.bg, border: `1px solid ${nodeColors.unobserved?.border}` }}></span>
              <span>未测变量</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: nodeColors.effect_modifier?.bg, border: `1px solid ${nodeColors.effect_modifier?.border}` }}></span>
              <span>效应修饰</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            保存
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-500 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
          >
            删除
          </button>
        </div>
      </div>
    </aside>
  )
}
