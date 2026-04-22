import React, { useState } from 'react'

export function NodeEditor({ node, mode, onUpdate, onDelete, onClose }) {
  const [label, setLabel] = useState(node.data.label || '')
  const [description, setDescription] = useState(node.data.description || '')
  const [variableType, setVariableType] = useState(node.data.type || '')

  const handleSave = () => {
    onUpdate({ label, description, type: variableType })
    onClose()
  }

  return (
    <aside className="w-72 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-slate-800 dark:text-white">编辑节点</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Variable Type */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            变量类型
          </label>
          <select
            value={variableType}
            onChange={(e) => setVariableType(e.target.value)}
            className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          >
            <option value="">选择类型</option>
            {mode === 'western' ? (
              <>
                <option value="exposure">暴露因素</option>
                <option value="outcome">结局</option>
                <option value="confounder">混杂因素</option>
                <option value="mediator">中介因素</option>
                <option value="effect-modifier">效应修饰</option>
                <option value="collider">对撞因子</option>
              </>
            ) : (
              <>
                <option value="pathogen">病位</option>
                <option value="syndrome">证素</option>
                <option value="symptom">症状</option>
                <option value="constitution">体质</option>
                <option value="external-factor">外邪</option>
                <option value="internal-factor">内伤</option>
              </>
            )}
          </select>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            变量名称
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="输入变量名称"
            className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
            说明/证据来源
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述该变量的来源、定义或引用文献..."
            rows={4}
            className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            保存
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-500 border border-red-200 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
          >
            删除
          </button>
        </div>
      </div>
    </aside>
  )
}
