import React, { useState, useEffect } from 'react'

const westernRoles = [
  { value: 'exposure',        label: '☀️ 暴露因素' },
  { value: 'outcome',          label: '🎯 结局' },
  { value: 'confounder',       label: '🔀 混杂因素' },
  { value: 'mediator',         label: '🔄 中介因素' },
  { value: 'effect_modifier',  label: '⚡ 效应修饰' },
  { value: 'instrument',       label: '🔧 工具变量' },
  { value: 'mediator_collected', label: '📤 收集的中介' },
  { value: 'proxy',            label: '📎 代理变量' },
  { value: 'selection',        label: '📊 选择偏倚' },
  { value: 'unobserved',       label: '❓ 未测变量' },
  { value: 'other',            label: '📋 其他' },
]

const tcmRoles = [
  { value: 'pathogen',         label: '📍 病位' },
  { value: 'syndrome',          label: '🧭 证素' },
  { value: 'symptom',           label: '📋 症状' },
  { value: 'constitution',     label: '🧬 体质' },
  { value: 'external-factor',  label: '🌪️ 外邪' },
  { value: 'internal-factor',  label: '💝 内伤' },
  { value: 'confounder',        label: '🔀 病因要素' },
  { value: 'mediator',          label: '🔄 病机转化' },
  { value: 'unobserved',        label: '❓ 未测变量' },
  { value: 'other',             label: '📋 其他' },
]

export function NodeEditor({ node, mode, onUpdate, onDelete, onClose, nodeColors, edgeColors }) {
  const [label, setLabel] = useState(node.data?.label || '')
  const [role, setRole] = useState(node.data?.role || 'other')
  const [description, setDescription] = useState(node.data?.description || '')
  const [evidence, setEvidence] = useState(node.data?.evidence || '')

  useEffect(() => {
    setLabel(node.data?.label || '')
    setRole(node.data?.role || 'other')
    setDescription(node.data?.description || '')
    setEvidence(node.data?.evidence || '')
  }, [node.id])

  const roles = mode === 'western' ? westernRoles : tcmRoles
  const colors = nodeColors[role] || nodeColors.other

  const previewStyle = {
    background: colors.bg,
    border: `2px ${colors.dashed ? 'dashed' : 'solid'} ${colors.border}`,
    borderRadius: '10px',
    color: colors.text,
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'inline-block',
    minWidth: '120px',
    textAlign: 'center',
  }

  const handleSave = () => {
    onUpdate({ label, role, description, evidence })
    onClose()
  }

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <h2 className="font-semibold text-slate-800 dark:text-white text-sm">编辑节点</h2>
        <div className="flex items-center gap-2">
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">删除</button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Preview */}
        <div className="text-center">
          <p className="text-[10px] text-slate-400 mb-1.5">节点预览</p>
          <div style={previewStyle}>{label || '变量名称'}</div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            🎯 变量角色（DAGitty风格）
          </label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            {role === 'exposure' && '因果推断的起点，干预变量'}
            {role === 'outcome' && '因果推断的终点，结果变量'}
            {role === 'confounder' && '同时影响暴露和结局的共同原因'}
            {role === 'mediator' && '暴露→结局传导路径上的中介'}
            {role === 'instrument' && '只影响暴露但不影响结局的工具变量'}
            {role === 'unobserved' && '未测量或不可测的潜变量（用虚线表示）'}
            {role === 'effect_modifier' && '效应修饰（改变因果效应大小的变量）'}
            {!['exposure','outcome','confounder','mediator','instrument','unobserved','effect_modifier'].includes(role) && '定义变量在因果图中的角色'}
          </p>
        </div>

        {/* Label */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            📝 变量名称
          </label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="例如：年龄、治疗方案..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            📖 操作性定义
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="描述变量的测量方式、定义来源..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
          />
        </div>

        {/* Evidence */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            📚 证据来源
          </label>
          <textarea
            value={evidence}
            onChange={e => setEvidence(e.target.value)}
            placeholder="引用文献、临床指南、专家共识..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
          />
        </div>

        {/* Role color guide */}
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-[11px]">
          <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">🎨 角色颜色指南</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400">
            {Object.entries(nodeColors).filter(([k]) => !['mediator_collected','proxy','selection','other'].includes(k)).slice(0,8).map(([k, c]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: c.bg, border: `1px solid ${c.border}` }}></span>
                <span className="capitalize">{k.replace('_',' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
        >
          保存更改
        </button>
      </div>
    </aside>
  )
}
