import React from 'react'

export function ModeSelector({ mode, setMode }) {
  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
      <button
        onClick={() => setMode('western')}
        className={`px-3 py-1 rounded text-sm transition-colors ${
          mode === 'western'
            ? 'bg-blue-500 text-white shadow'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
      >
        🏥 西医模式
      </button>
      <button
        onClick={() => setMode('tcm')}
        className={`px-3 py-1 rounded text-sm transition-colors ${
          mode === 'tcm'
            ? 'bg-emerald-500 text-white shadow'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
      >
        🏯 中医模式
      </button>
    </div>
  )
}
