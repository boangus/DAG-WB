/**
 * DAG-WB v3.1 — Full dagitty interaction model
 *
 * Keyboard shortcuts:
 *   E = ☀️ exposure   O = 🎯 outcome   D = 🗑️ delete   N = ✨ new variable
 *   R = 📝 rename    S = 📊 selection bias   U = ❓ unobserved   A = 🔀 confounder
 *   M = 🔗 mediator  I = 📌 instrument  P = 📎 proxy  X = ⚙️ effect_modifier
 *
 * Interactions (dagitty-style):
 *   Click pane → inline variable name prompt → add node at click position
 *   Click node A → Click node B = add edge (directed: A→B)
 *   Double-click node = quick rename
 *   Edge labels toggle: click edge to show/hide label
 *
 * Based on jtextor/dagitty (GPL) + Quimpo & Steiner 2026 methodology
 */

import React, {
  useState, useCallback, useMemo, useRef, useEffect,
} from 'react'
import {
  ReactFlow,
  MiniMap, Controls, Background,
  useNodesState, useEdgesState,
  Panel, MarkerType, BackgroundVariant,
  ReactFlowProvider, useReactFlow,
  useKeyPress,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'

import { NodeEditor } from './components/NodeEditor'
import { ExportPanel } from './components/ExportPanel'
import { ModeSelector } from './components/ModeSelector'
import { ReviewAgent } from './agents/ReviewAgent'
import { Toolbar } from './components/Toolbar'

// ============================================================
// Constants
// ============================================================
export const NODE_COLORS = {
  exposure:          { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  outcome:           { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  confounder:        { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  mediator:          { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  effect_modifier:   { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  instrument:        { bg: '#ffedd5', border: '#d97706', text: '#92400e' },
  proxy:            { bg: '#f3f4f6', border: '#6b7280', text: '#374151' },
  unobserved:        { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', dashed: true },
  selection:        { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  other:            { bg: '#f9fafb', border: '#9ca3af', text: '#4b5563' },
}

const EDEF = {
  direct:    { color: '#2563eb', animated: false },
  confounding:{ color: '#7c3aed', animated: false },
  mediation:  { color: '#059669', animated: false },
  collider:  { color: '#d97706', animated: false },
  instrument: { color: '#9333ea', animated: false },
  measurement:{ color: '#6b7280', animated: false },
  selection: { color: '#ca8a04', animated: false },
  bias:      { color: '#dc2626', animated: true  },
}

const ELABEL = {
  direct:    '直接效应',
  confounding:'混杂',
  mediation:  '中介',
  collider:  '碰撞',
  instrument:'工具变量',
  measurement:'测量误差',
  selection: '选择偏倚',
  bias:      '效应修饰',
}

const EACTION = {
  direct:    '→直接',
  confounding:'→混杂',
  mediation:  '→中介',
  collider:  '→碰撞',
  instrument:'→工具',
}

// ============================================================
// Core inference engine (Quimpo 2026)
// ============================================================
function inferEdgeType(src, tgt, edges) {
  const s = src.data?.role
  const t = tgt.data?.role

  // Rule 1: Colliders — target already has another parent
  const hasOther = edges.some(e => e.target === tgt.id && e.source !== src.id)
  if (hasOther) return 'collider'

  // Rule 2: Confounder connections
  if (s === 'confounder' || s === 'unobserved') {
    if (t === 'outcome' || t === 'mediator') return 'confounding'
    if (s === 'unobserved') return 'confounding'
  }

  // Rule 3: Direct effect
  if (s === 'exposure' && t === 'outcome') return 'direct'

  // Rule 4: Mediation
  if ((s === 'exposure' && t === 'mediator') ||
      (s === 'mediator' && t === 'outcome')) return 'mediation'

  // Rule 5: Instrument
  if (s === 'instrument' && t === 'exposure') return 'instrument'

  // Rule 6: Other
  if (s === 'selection') return 'selection'
  if (s === 'effect_modifier') return 'bias'
  if (s === 'proxy') return 'measurement'

  return 'direct'
}

function getEdgeLabel(s, t, type) {
  if (type === 'mediation') return s === 'exposure' ? '中介入' : '中介出'
  return ELABEL[type] || '因果'
}

// ============================================================
// Node styling
// ============================================================
function styleNode(n) {
  const c = NODE_COLORS[n.data?.role] || NODE_COLORS.other
  return {
    ...n,
    style: {
      background: c.bg,
      border: `${c.dashed ? '2px dashed' : '2px solid'} ${c.border}`,
      borderRadius: '10px', padding: '8px 16px',
      fontSize: '13px', fontWeight: 600,
      color: c.text,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    },
  }
}

function styleEdge(e, cfg) {
  return {
    ...e,
    style: { stroke: cfg.color, strokeWidth: 2 },
    animated: cfg.animated,
    markerEnd: { type: MarkerType.ArrowClosed, color: cfg.color, width: 18, height: 18 },
  }
}

// ============================================================
// Layout (dagre)
// ============================================================
function layoutAll(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  const W = 175, H = 52
  g.graph({ rankdir: 'LR', nodesep: 75, ranksep: 140 })
  nodes.forEach(n => g.setNode(n.id, { width: W, height: H }))
  edges.forEach(e => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return nodes.map(n => {
    const p = g.node(n.id)
    if (!p) return n
    return { ...n, position: { x: p.x - W / 2, y: p.y - H / 2 } }
  })
}

// ============================================================
// App Component
// ============================================================
function AppContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('western')
  const [showExport, setShowExport] = useState(false)
  const [showAgent, setShowAgent] = useState(false)
  const [newVar, setNewVar] = useState(null) // { x, y }
  const [lastClicked, setLastClicked] = useState(null) // for edge creation
  const [pendingEdge, setPendingEdge] = useState(null) // { source, target } for label choice
  const [showEdgeMenu, setShowEdgeMenu] = useState(false) // show edge label toggle menu
  const [showLabel, setShowLabel] = useState(true) // global toggle for edge labels

  const { fitView, getViewport } = useReactFlow()
  const reactFlowWrapper = useRef(null)

  const styled = useMemo(() => nodes.map(n => n.style ? n : styleNode(n)), [nodes])

  // ============================================================
  // Core ops
  // ============================================================

  // Infer + style new edge
  const connect = useCallback((src, tgt, showLabelVal = true) => {
    const s = nodes.find(n => n.id === src)
    const t = nodes.find(n => n.id === tgt)
    if (!s || !t) return
    const type = inferEdgeType(s, t, edges)
    const cfg = EDEF[type]
    const label = getEdgeLabel(s.data.role, t.data.role, type)
    const edgeId = `e${src}->${tgt}`
    const edge = {
      id: edgeId,
      source: src,
      target: tgt,
      label: showLabelVal ? label : '',
      ...styleEdge({ id: edgeId, source: src, target: tgt }, cfg),
      labelStyle: { fill: cfg.color, fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
      labelBgPadding: [3, 6],
      labelBgBorderRadius: 4,
      data: { ...cfg, showLabel: showLabelVal, edgeType: type },
    }
    setEdges(eds => {
      const exists = eds.some(e => e.source === src && e.target === tgt)
      if (exists) {
        // Update existing edge
        return eds.map(e => e.source === src && e.target === tgt ? edge : e)
      }
      return [...eds, edge]
    })
    return edgeId
  }, [nodes, edges])

  const updateNode = useCallback((id, data) => {
    setNodes(nds => {
      const updated = nds.map(n => n.id === id ? styleNode({ ...n, data: { ...n.data, ...data } }) : n)
      return updated
    })
    // Update edge styles after role change
    setEdges(eds => {
      return eds.map(e => {
        const s = nodes.find(n => n.id === e.source)
        const t = nodes.find(n => n.id === e.target)
        if (!s || !t) return e
        const newS = s.id === id ? { ...s, data: { ...s.data, ...data } } : s
        const newT = t.id === id ? { ...t, data: { ...t.data, ...data } } : t
        const type = inferEdgeType(styleNode(newS), styleNode(newT), eds)
        const cfg = EDEF[type]
        const label = getEdgeLabel(newS.data.role, newT.data.role, type)
        return {
          ...e,
          ...styleEdge(e, cfg),
          label: e.data?.showLabel ? label : '',
          labelStyle: { fill: cfg.color, fontSize: 11, fontWeight: 600 },
          labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
          labelBgPadding: [3, 6],
          labelBgBorderRadius: 4,
          data: { ...e.data, ...cfg, edgeType: type },
        }
      })
    })
  }, [nodes])

  const deleteNode = useCallback(id => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    setSelected(null)
  }, [])

  const deleteEdge = useCallback(id => {
    setEdges(eds => eds.filter(e => e.id !== id))
  }, [])

  const toggleEdgeLabel = useCallback((edgeId, show) => {
    setEdges(eds => eds.map(e => {
      if (e.id !== edgeId) return e
      return { ...e, label: show ? e.data?.edgeType ? ELABEL[e.data.edgeType] || '因果' : '因果' : '' }
    }))
  }, [])

  // ============================================================
  // Event handlers
  // ============================================================

  const onConnect = useCallback(params => {
    if (params.source && params.target) {
      setPendingEdge({ source: params.source, target: params.target })
      setShowEdgeMenu(true)
    }
  }, [])

  // Node click handler - for edge creation (click A then click B = edge)
  const onNodeClick = useCallback((e, n) => {
    e.stopPropagation()

    if (lastClicked && lastClicked !== n.id) {
      // Create edge from lastClicked to this node
      setPendingEdge({ source: lastClicked, target: n.id })
      setShowEdgeMenu(true)
      setLastClicked(null)
    } else {
      // First click - select node
      setSelected(n)
      setLastClicked(n.id)
    }
  }, [lastClicked])

  // Double-click to rename
  const onNodeDoubleClick = useCallback((e, n) => {
    e.stopPropagation()
    const label = window.prompt('重命名变量', n.data.label)
    if (label && label.trim()) {
      updateNode(n.id, { label: label.trim() })
    }
  }, [updateNode])

  const onPaneClick = useCallback(e => {
    setSelected(null)
    setLastClicked(null)
    const pane = e.target?.closest('.react-flow__pane')
    if (!pane) return
    // Only trigger on background elements
    const tag = e.target.tagName
    if (['svg', 'rect', 'path'].includes(tag) || e.target?.classList?.contains('react-flow__background')) {
      const rect = pane.getBoundingClientRect()
      setNewVar({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    } else {
      setNewVar(null)
    }
  }, [])

  // Handle add variable form
  const handleAdd = useCallback(label => {
    if (!label?.trim() || !newVar) { setNewVar(null); return }
    const pos = { x: newVar.x, y: newVar.y }
    const id = `${label.trim()}-${Date.now()}`
    const n = {
      id, position: pos,
      data: { label: label.trim(), role: 'exposure' },
    }
    setNodes(nds => {
      const styledNds = nds.map(styleNode)
      return layoutAll([...styledNds, n], edges)
    })
    setNewVar(null)
  }, [newVar, edges])

  // Handle edge label choice
  const handleEdgeCreate = useCallback((showLabelVal) => {
    if (pendingEdge) {
      connect(pendingEdge.source, pendingEdge.target, showLabelVal)
      setPendingEdge(null)
    }
    setShowEdgeMenu(false)
  }, [pendingEdge, connect])

  // Edge click to toggle label
  const onEdgeClick = useCallback((e, edge) => {
    e.stopPropagation()
    const currentShow = edge.data?.showLabel !== false
    toggleEdgeLabel(edge.id, !currentShow)
  }, [toggleEdgeLabel])

  // Keyboard shortcuts (dagitty-style)
  useEffect(() => {
    if (!selected) return
    const id = selected.id

    const handleKey = (e) => {
      if (newVar) return
      const k = e.key
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'

      if (k === 'e' || k === 'E') { updateNode(id, { role: 'exposure' }); return }
      if (k === 'o' || k === 'O') { updateNode(id, { role: 'outcome' }); return }
      if (k === 'a' || k === 'A') {
        const cur = selected.data?.role
        const next = cur === 'confounder' ? 'other' : 'confounder'
        updateNode(id, { role: next })
        return
      }
      if (k === 'u' || k === 'U') { updateNode(id, { role: 'unobserved' }); return }
      if (k === 's' || k === 'S') { updateNode(id, { role: 'selection' }); return }
      if (k === 'm' || k === 'M') { updateNode(id, { role: 'mediator' }); return }
      if (k === 'i' || k === 'I') { updateNode(id, { role: 'instrument' }); return }
      if (k === 'p' || k === 'P') { updateNode(id, { role: 'proxy' }); return }
      if (k === 'x' || k === 'X') { updateNode(id, { role: 'effect_modifier' }); return }
      if (k === 'r' || k === 'R') {
        if (isInput) return
        const label = window.prompt('变量重命名', selected.data.label)
        if (label) updateNode(id, { label })
        return
      }
      if (k === 'd' || k === 'D') {
        // Find if this node has any edges
        const hasEdges = edges.some(ee => ee.source === id || ee.target === id)
        if (hasEdges) {
          // Delete all edges connected to this node
          setEdges(eds => eds.filter(ee => ee.source !== id && ee.target !== id))
        } else {
          deleteNode(id)
        }
        return
      }
      if (k === 'Escape') {
        setNewVar(null)
        setSelected(null)
        setLastClicked(null)
        setPendingEdge(null)
        setShowEdgeMenu(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selected, newVar, updateNode, deleteNode, edges])

  const autoLayout = useCallback(() => {
    setNodes(nds => layoutAll(nds, edges))
    setTimeout(() => fitView({ padding: 0.15, duration: 500 }), 50)
  }, [edges, fitView])

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 dark:bg-slate-900">

      {/* Header */}
      <header className="h-13 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center px-4 gap-3 shrink-0">
        <h1 className="text-base font-bold text-slate-800 dark:text-white">
          <span className="text-sm font-normal text-slate-400 mr-1">DAGitty-style</span>
        </h1>
        <ModeSelector mode={mode} setMode={setMode} />
        <div className="flex-1" />
        <button
          onClick={() => setShowLabel(!showLabel)}
          className={`px-4 py-1.5 rounded-lg text-sm ${showLabel ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'}`}
        >
          {showLabel ? '📝 显示箭头标签' : '🔇 隐藏箭头标签'}
        </button>
        <button onClick={autoLayout}
          className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600">
          ⚡ 自动布局
        </button>
        <button onClick={() => setShowAgent(true)}
          className="px-4 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600">
          📚 文献Agent
        </button>
        <button onClick={() => setShowExport(true)}
          className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600">
          导出
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* Toolbar */}
        <Toolbar
          onAdd={v => {
            const id = `${v.label}-${Date.now()}`
            const n = {
              id, position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
              data: { label: v.label, role: v.role },
            }
            setNodes(nds => {
              const styledNds = nds.map(styleNode)
              return layoutAll([...styledNds, n], edges)
            })
          }}
          onClear={() => { setNodes([]); setEdges([]) }}
        />

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>

          <ReactFlow
            nodes={styled}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onPaneClick={onPaneClick}
            onEdgeClick={onEdgeClick}
            fitView
            minZoom={0.1} maxZoom={3}
            defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }}}
            className="bg-slate-50 dark:bg-slate-900"
          >
            <Controls className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow" />
            <MiniMap
              nodeColor={n => NODE_COLORS[n.data?.role]?.bg || '#e2e8f0'}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow"
            />
            <Background color="#cbd5e1" gap={20} variant={BackgroundVariant.Dots} />

            {/* New variable prompt (dagitty-style inline input) */}
            {newVar && (
              <Panel position="top-center">
                <form
                  onSubmit={e => { e.preventDefault(); handleAdd(e.target.vname.value) }}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl px-4 py-3"
                >
                  <span className="text-sm text-slate-500 dark:text-slate-300 whitespace-nowrap">变量名:</span>
                  <input
                    name="vname"
                    autoFocus
                    placeholder="输入变量名，Enter添加"
                    className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                    添加
                  </button>
                  <button type="button" onClick={() => setNewVar(null)}
                    className="px-2 py-1.5 text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </form>
              </Panel>
            )}

            {/* Edge label choice menu */}
            {showEdgeMenu && pendingEdge && (
              <Panel position="top-center">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl px-4 py-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    为箭头 <span className="font-semibold">添加标签?</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdgeCreate(true)}
                      className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                    >
                      ✅ 显示标签
                    </button>
                    <button
                      onClick={() => handleEdgeCreate(false)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300"
                    >
                      ❌ 隐藏标签
                    </button>
                  </div>
                </div>
              </Panel>
            )}

            {/* Shortcuts panel */}
            <Panel position="top-right"
              className="bg-white/95 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs space-y-1.5 max-w-xs">
              <p className="font-semibold text-slate-700 dark:text-slate-200">🎮 快捷键</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-600 dark:text-slate-300">
                <span><kbd className="kbd me-1">点击</kbd>选/连线</span>
                <span><kbd className="kbd me-1">双击</kbd>重命名</span>
                <span><kbd className="kbd me-1">E</kbd>☀️暴露</span>
                <span><kbd className="kbd me-1">O</kbd>🎯结局</span>
                <span><kbd className="kbd me-1">A</kbd>🔀混杂</span>
                <span><kbd className="kbd me-1">U</kbd>❓未测</span>
                <span><kbd className="kbd me-1">M</kbd>🔗中介</span>
                <span><kbd className="kbd me-1">I</kbd>📌工具</span>
                <span><kbd className="kbd me-1">S</kbd>📊选择</span>
                <span><kbd className="kbd me-1">P</kbd>📎代理</span>
                <span><kbd className="kbd me-1">X</kbd>⚙️修饰</span>
                <span><kbd className="kbd me-1">R</kbd>📝重命名</span>
                <span><kbd className="kbd me-1">D</kbd>🗑️删除</span>
                <span><kbd className="kbd me-1">Esc</kbd>取消</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                点击节点A → 点击节点B = 添加箭头 | 点击箭头 = 切换标签显示
              </p>
            </Panel>
          </ReactFlow>
        </div>

        {/* Node editor */}
        {selected && (
          <NodeEditor
            node={selected}
            onUpdate={data => updateNode(selected.id, data)}
            onDelete={() => deleteNode(selected.id)}
            onClose={() => setSelected(null)}
          />
        )}

        {/* Export */}
        {showExport && (
          <ExportPanel
            nodes={nodes} edges={edges}
            onClose={() => setShowExport(false)}
          />
        )}

        {/* Agent */}
        {showAgent && (
          <div className="w-[500px] border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800">📚 文献Agent</h2>
              <button onClick={() => setShowAgent(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ReviewAgent mode={mode}
                onExport={ev => {
                  if (!ev?.variables?.length) return
                  const nds = ev.variables.map((v, i) => styleNode({
                    id: `v-${i}-${Date.now()}`,
                    position: { x: 0, y: 0 },
                    data: { label: v.name, role: v.type },
                  }))
                  setNodes(ds => {
                    const updated = [...ds, ...nds]
                    return layoutAll(updated, edges)
                  })
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppContent />
    </ReactFlowProvider>
  )
}
