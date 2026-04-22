/**
 * DAG-WB - Causal DAG Visualization with Automatic Edge Inference
 * Based on Quimpo & Steiner (2026) methodology
 * Inspired by DAGitty's text-based model
 *
 * Key insight: Edges are automatically typed based on node roles and graph structure.
 * - Connecting X→Y (exposure→outcome) = 直接效应
 * - Connecting C→X (confounder→exposure) = 混杂
 * - Connecting C→Y (confounder→outcome) = 混杂
 * - When node has multiple incoming edges = 碰撞结构
 * - Connecting E→M→Y = 中介
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'

import { Toolbar } from './components/Toolbar'
import { NodeEditor } from './components/NodeEditor'
import { ExportPanel } from './components/ExportPanel'
import { ModeSelector } from './components/ModeSelector'
import { ReviewAgent } from './agents/ReviewAgent'

// ============================================================
// DAGitty-style Node Roles & Colors
// ============================================================
export const NODE_COLORS = {
  exposure:         { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  outcome:          { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  confounder:       { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  mediator:         { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  effect_modifier:  { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  instrument:       { bg: '#ffedd5', border: '#d97706', text: '#9a3412' },
  mediator_collected:{ bg: '#ccfbf1', border: '#14b8a6', text: '#115e59' },
  proxy:            { bg: '#f3f4f6', border: '#6b7280', text: '#374151' },
  unobserved:       { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', dashed: true },
  selection:        { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  collider:         { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  other:            { bg: '#f9fafb', border: '#9ca3af', text: '#4b5563' },
}

// ============================================================
// Edge Type Inference (Quimpo 2026 methodology)
// When a new edge is added, infer its type from node roles + graph structure
// ============================================================
export const EDGE_COLORS = {
  direct:     { color: '#2563eb', label: '直接效应',      animated: false },
  confounding: { color: '#7c3aed', label: '混杂',          animated: false },
  mediation:   { color: '#059669', label: '中介',          animated: false },
  collider:   { color: '#d97706', label: '碰撞/偏倚',     animated: false },
  instrument:  { color: '#d97706', label: '工具变量路径',   animated: false },
  bias:        { color: '#dc2626', label: '偏倚路径',      animated: true  },
  measurement: { color: '#6b7280', label: '测量误差',      animated: false },
  selection:   { color: '#ca8a04', label: '选择偏倚',     animated: false },
}

/**
 * Infer edge type when connecting source → target
 * Uses Quimpo 2026's methodology for DAG construction:
 * 1. Start with causal process (exposure → outcome)
 * 2. Add confounders (common causes of exposure and outcome)
 * 3. Add mediators (on the causal pathway)
 * 4. Identify colliders (variables caused by multiple parents)
 */
function inferEdgeType(sourceNode, targetNode, existingEdges) {
  const sRole = sourceNode.data?.role
  const tRole = targetNode.data?.role

  // Find existing incoming edges to the target (for collider detection)
  const existingIncomingToTarget = existingEdges.filter(e => e.target === targetNode.id)
  const hasOtherParent = existingIncomingToTarget.length > 0

  // If target already has other incoming edges → this is a collider path
  if (hasOtherParent) {
    return 'collider'
  }

  // --- CONFOUNDING: confounder → anything (that isn't outcome via direct path) ---
  if (sRole === 'confounder' || sRole === 'unobserved') {
    if (tRole === 'outcome' || tRole === 'mediator' || tRole === 'exposure') {
      return 'confounding'
    }
  }

  // --- DIRECT EFFECT: exposure → outcome ---
  if (sRole === 'exposure' && tRole === 'outcome') {
    return 'direct'
  }

  // --- MEDIATION: exposure → mediator | mediator → outcome ---
  if (sRole === 'exposure' && tRole === 'mediator') {
    return 'mediation'
  }
  if (sRole === 'mediator' && tRole === 'outcome') {
    return 'mediation'
  }
  if (sRole === 'mediator_collected' && tRole === 'outcome') {
    return 'mediation'
  }

  // --- INSTRUMENT: instrument → exposure ---
  if (sRole === 'instrument' && tRole === 'exposure') {
    return 'instrument'
  }

  // --- MEASUREMENT: proxy → construct ---
  if (sRole === 'proxy') {
    return 'measurement'
  }

  // --- SELECTION: selection → anything ---
  if (sRole === 'selection') {
    return 'selection'
  }

  // --- EFFECT MODIFIER ---
  if (sRole === 'effect_modifier') {
    return 'bias' // effect modifiers create bias paths
  }

  // Default: use direct
  return 'direct'
}

function inferEdgeLabel(sourceNode, targetNode, edgeType, existingEdges) {
  const sRole = sourceNode.data?.role
  const tRole = targetNode.data?.role

  switch (edgeType) {
    case 'direct':     return '直接效应'
    case 'confounding': return '混杂'
    case 'mediation':   return sRole === 'exposure' ? '中介入口' : '中介出口'
    case 'collider':    return '碰撞结构'
    case 'instrument':  return '工具变量'
    case 'measurement': return '测量关系'
    case 'selection':   return '选择偏倚'
    case 'bias':        return '效应修饰'
    default:            return '因果关联'
  }
}

function createStyledEdge(params, sourceNode, targetNode, existingEdges) {
  const edgeType = inferEdgeType(sourceNode, targetNode, existingEdges)
  const edgeConfig = EDGE_COLORS[edgeType] || EDGE_COLORS.direct
  const label = inferEdgeLabel(sourceNode, targetNode, edgeType, existingEdges)

  return {
    ...params,
    id: params.id || `e${params.source}-${params.target}-${Date.now()}`,
    type: 'smoothstep',
    animated: edgeConfig.animated,
    style: { stroke: edgeConfig.color, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeConfig.color,
      width: 20,
      height: 20,
    },
    data: {
      edgeType,
      label,
      sourceRole: sourceNode.data?.role,
      targetRole: targetNode.data?.role,
    },
    label: label,
    labelStyle: { fill: edgeConfig.color, fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.92 },
    labelBgPadding: [3, 6],
    labelBgBorderRadius: 3,
  }
}

// ============================================================
// Dagre Layout
// ============================================================
const getLayoutedNodes = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  const nodeWidth = 160
  const nodeHeight = 44
  dagreGraph.setGraph({ rankdir: direction, nodesep: 70, ranksep: 130 })
  nodes.forEach(node => dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight }))
  edges.forEach(edge => dagreGraph.setEdge(edge.source, edge.target))
  dagre.layout(dagreGraph)
  return nodes.map(node => {
    const pos = dagreGraph.node(node.id)
    return {
      ...node,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
    }
  })
}

const applyNodeStyle = (node) => {
  const colors = NODE_COLORS[node.data?.role] || NODE_COLORS.other
  return {
    ...node,
    style: {
      background: colors.bg,
      border: `2px ${colors.dashed ? 'dashed' : 'solid'} ${colors.border}`,
      borderRadius: '10px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: 600,
      color: colors.text,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  }
}

// Initial example DAG
const makeInitialNodes = () => [
  { id: 'E', position: { x: 0, y: 80 }, data: { label: '暴露因素 (E)', role: 'exposure' } },
  { id: 'Y', position: { x: 400, y: 80 }, data: { label: '结局 (Y)', role: 'outcome' } },
  { id: 'C', position: { x: 200, y: 0 }, data: { label: '混杂因素 (C)', role: 'confounder' } },
  { id: 'M', position: { x: 200, y: 160 }, data: { label: '中介因素 (M)', role: 'mediator' } },
].map(n => applyNodeStyle(n))

const makeInitialEdges = (nodes) => [
  createStyledEdge(
    { id: 'e1', source: 'E', target: 'Y' },
    nodes.find(n => n.id === 'E'),
    nodes.find(n => n.id === 'Y'),
    []
  ),
  createStyledEdge(
    { id: 'e2', source: 'E', target: 'M' },
    nodes.find(n => n.id === 'E'),
    nodes.find(n => n.id === 'M'),
    [{ id: 'e1', source: 'E', target: 'Y' }]
  ),
  createStyledEdge(
    { id: 'e3', source: 'M', target: 'Y' },
    nodes.find(n => n.id === 'M'),
    nodes.find(n => n.id === 'Y'),
    [{ id: 'e1', source: 'E', target: 'Y' }, { id: 'e2', source: 'E', target: 'M' }]
  ),
  createStyledEdge(
    { id: 'e4', source: 'C', target: 'E' },
    nodes.find(n => n.id === 'C'),
    nodes.find(n => n.id === 'E'),
    [{ id: 'e1', source: 'E', target: 'Y' }, { id: 'e2', source: 'E', target: 'M' }, { id: 'e3', source: 'M', target: 'Y' }]
  ),
  createStyledEdge(
    { id: 'e5', source: 'C', target: 'Y' },
    nodes.find(n => n.id === 'C'),
    nodes.find(n => n.id === 'Y'),
    [{ id: 'e1', source: 'E', target: 'Y' }, { id: 'e2', source: 'E', target: 'M' }, { id: 'e3', source: 'M', target: 'Y' }, { id: 'e4', source: 'C', target: 'E' }]
  ),
]

const initialNodes = makeInitialNodes()
const initialEdges = makeInitialEdges(initialNodes)

// ============================================================
// Main App
// ============================================================
function AppInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [mode, setMode] = useState('western')
  const [showExport, setShowExport] = useState(false)
  const [showReviewAgent, setShowReviewAgent] = useState(false)
  const { fitView, setCenter, zoomTo } = useReactFlow()

  // Apply styles to nodes (only if not already styled)
  const styledNodes = useMemo(() =>
    nodes.map(n => n.style ? n : applyNodeStyle(n)),
    [nodes]
  )

  // Auto-layout handler
  const handleAutoLayout = useCallback(() => {
    const layouted = getLayoutedNodes(styledNodes, edges, 'LR')
    setNodes(layouted)
    setTimeout(() => fitView({ padding: 0.15, duration: 500 }), 50)
  }, [styledNodes, edges, setNodes, fitView])

  // When connecting nodes, infer edge type from roles
  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source)
    const targetNode = nodes.find(n => n.id === params.target)
    if (!sourceNode || !targetNode) return
    const styledEdge = createStyledEdge(params, sourceNode, targetNode, edges)
    setEdges(eds => addEdge(styledEdge, eds))
  }, [nodes, edges, setEdges])

  const onNodeClick = useCallback((event, node) => setSelectedNode(node), [])
  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  const updateNode = useCallback((id, data) => {
    setNodes(nds => nds.map(n => n.id === id ? applyNodeStyle({ ...n, data: { ...n.data, ...data } }) : n))
  }, [setNodes])

  const addNode = useCallback((newNode) => {
    const node = applyNodeStyle({
      id: `${newNode.data.role}-${Date.now()}`,
      position: { x: 0, y: 0 },
      ...newNode,
    })
    const layouted = getLayoutedNodes([...nodes, node], edges, 'LR')
    setNodes(layouted)
  }, [nodes, edges, setNodes])

  const deleteNode = useCallback((id) => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  const handleExportEvidence = useCallback((evidence) => {
    if (!evidence.variables?.length) return
    const newNodes = evidence.variables.map((v, i) => {
      const colors = NODE_COLORS[v.type] || NODE_COLORS.other
      return {
        id: `var-${i}-${Date.now()}`,
        position: { x: 0, y: 0 },
        data: { label: v.name, role: v.type, source: 'review-agent' },
        style: {
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '10px',
          padding: '8px 14px',
          fontSize: '13px',
          fontWeight: 600,
          color: colors.text,
        },
      }
    })
    const layouted = getLayoutedNodes([...nodes, ...newNodes], edges, 'LR')
    setNodes(layouted)
  }, [nodes, edges, setNodes])

  // Update edge styles when nodes change roles
  const updateAllEdgeStyles = useCallback(() => {
    setEdges(eds => eds.map(e => {
      const s = nodes.find(n => n.id === e.source)
      const t = nodes.find(n => n.id === e.target)
      if (!s || !t) return e
      const newType = inferEdgeType(s, t, eds.filter(x => x.id !== e.id))
      const newLabel = inferEdgeLabel(s, t, newType, eds.filter(x => x.id !== e.id))
      const cfg = EDGE_COLORS[newType] || EDGE_COLORS.direct
      return {
        ...e,
        style: { stroke: cfg.color, strokeWidth: 2 },
        animated: cfg.animated,
        markerEnd: { type: MarkerType.ArrowClosed, color: cfg.color, width: 20, height: 20 },
        data: { ...e.data, edgeType: newType, label: newLabel },
        label: newLabel,
        labelStyle: { fill: cfg.color, fontSize: 11, fontWeight: 600 },
      }
    }))
  }, [nodes, setEdges])

  // Re-style edges whenever nodes change
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    // After nodes change, update edge styles if any role changed
    const roleChanged = changes.some(c => c.type === 'style' || c.type === 'position')
    if (roleChanged) {
      setTimeout(updateAllEdgeStyles, 0)
    }
  }, [onNodesChange, updateAllEdgeStyles])

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center px-4 gap-3 shrink-0">
        <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
          DAG-WB <span className="text-xs font-normal text-slate-400 ml-1">v2.0</span>
        </h1>
        <ModeSelector mode={mode} setMode={setMode} />
        <div className="flex-1" />
        <button onClick={handleAutoLayout}
          className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors font-medium"
          title="按暴露→结局方向自动布局"
        >
          ⚡ 自动布局
        </button>
        <button onClick={() => setShowReviewAgent(true)}
          className="px-4 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
        >
          📚 文献综述Agent
        </button>
        <button onClick={() => setShowExport(true)}
          className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
        >
          导出
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar
          mode={mode}
          onAddNode={addNode}
          onClear={() => { setNodes([]); setEdges([]) }}
          nodeColors={NODE_COLORS}
        />

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={styledNodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            className="bg-slate-50 dark:bg-slate-900"
            defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Controls className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow" />
            <MiniMap
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow"
              nodeColor={n => n.style?.background || '#e2e8f0'}
              maskColor="rgba(0,0,0,0.1)"
            />
            <Background color="#cbd5e1" gap={20} variant={BackgroundVariant.Dots} />

            {/* Legend Panel */}
            <Panel position="top-right" className="bg-white/95 dark:bg-slate-800/95 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs space-y-2 max-w-xs">
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">⬇️ 连线自动判断边类型</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1"><span className="text-blue-600 font-bold">→</span> 暴露→结局 = 直接效应</span>
                <span className="flex items-center gap-1"><span className="text-purple-600 font-bold">→</span> 混杂→任一 = 混杂</span>
                <span className="flex items-center gap-1"><span className="text-green-600 font-bold">→</span> 暴露→中介 = 中介</span>
                <span className="flex items-center gap-1"><span className="text-amber-600 font-bold">→</span> 多入→节点 = 碰撞</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1">
                <p className="text-slate-500 dark:text-slate-400">💡 点击节点可编辑角色 | 拖拽边缘连线</p>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Panel: Node Editor */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            mode={mode}
            nodeColors={NODE_COLORS}
            edgeColors={EDGE_COLORS}
            onUpdate={(data) => {
              updateNode(selectedNode.id, data)
              // Update edge styles after role change
              setTimeout(updateAllEdgeStyles, 0)
            }}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {/* Export Panel */}
        {showExport && (
          <ExportPanel nodes={nodes} edges={edges} onClose={() => setShowExport(false)} />
        )}

        {/* Review Agent Panel */}
        {showReviewAgent && (
          <div className="w-[500px] border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white">📚 文献综述Agent</h2>
              <button onClick={() => setShowReviewAgent(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ReviewAgent mode={mode} onExportEvidence={handleExportEvidence} />
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
      <AppInner />
    </ReactFlowProvider>
  )
}
