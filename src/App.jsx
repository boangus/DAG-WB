import React, { useState, useCallback, useMemo } from 'react'
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'

import { Toolbar } from './components/Toolbar'
import { NodeEditor } from './components/NodeEditor'
import { ExportPanel } from './components/ExportPanel'
import { ModeSelector } from './components/ModeSelector'
import { ReviewAgent } from './agents/ReviewAgent'

// DAGitty-style node role colors
export const NODE_COLORS = {
  exposure: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  outcome: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  confounder: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  mediator: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  effect_modifier: { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  instrument: { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  mediator_collected: { bg: '#ccfbf1', border: '#14b8a6', text: '#115e59' },
  proxy: { bg: '#f3f4f6', border: '#6b7280', text: '#374151' },
  unobserved: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', dashed: true },
  selection: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  other: { bg: '#f9fafb', border: '#9ca3af', text: '#4b5563' },
}

// Default edge styles by type
export const EDGE_STYLES = {
  direct: { color: '#2563eb', label: '直接效应', animated: false },
  confounding: { color: '#7c3aed', label: '混杂', animated: false },
  mediation: { color: '#059669', label: '中介', animated: false },
  bias: { color: '#dc2626', label: '偏倚路径', animated: false },
  selection: { color: '#ca8a04', label: '选择偏倚', animated: false },
  measurement: { color: '#6b7280', label: '测量误差', animated: false },
}

// Get layouted nodes using dagre
const getLayoutedNodes = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  const nodeWidth = 180
  const nodeHeight = 50

  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return layoutedNodes
}

// Initial example nodes
const createInitialNodes = () => {
  const nodes = [
    { id: '1', position: { x: 0, y: 100 }, data: { label: '暴露因素 (E)', role: 'exposure' } },
    { id: '2', position: { x: 0, y: 250 }, data: { label: '结局 (Y)', role: 'outcome' } },
    { id: '3', position: { x: 0, y: 175 }, data: { label: '混杂因素 (C)', role: 'confounder' } },
  ]
  return getLayoutedNodes(nodes, [])
}

const createStyledNode = (node) => {
  const colors = NODE_COLORS[node.data?.role] || NODE_COLORS.other
  return {
    ...node,
    style: {
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      borderStyle: colors.dashed ? 'dashed' : 'solid',
      borderRadius: '8px',
      padding: '10px 15px',
      fontSize: '14px',
      fontWeight: 500,
      color: colors.text,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  }
}

// Default edges with arrow markers
const createStyledEdge = (edge, type = 'direct') => {
  const edgeConfig = EDGE_STYLES[type] || EDGE_STYLES.direct
  return {
    ...edge,
    type: 'smoothstep',
    animated: edgeConfig.animated,
    style: { stroke: edgeConfig.color, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edgeConfig.color,
      width: 20,
      height: 20,
    },
    label: edgeConfig.label,
    labelStyle: { fill: edgeConfig.color, fontSize: 12, fontWeight: 500 },
    labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
    labelBgPadding: [4, 8],
    labelBgBorderRadius: 4,
  }
}

const initialNodes = createInitialNodes()
const initialEdges = [
  createStyledEdge({ id: 'e1-2', source: '1', target: '2' }, 'direct'),
  createStyledEdge({ id: 'e1-3', source: '1', target: '3' }, 'confounding'),
  createStyledEdge({ id: 'e3-2', source: '3', target: '2' }, 'confounding'),
]

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [mode, setMode] = useState('western')
  const [showExport, setShowExport] = useState(false)
  const [showReviewAgent, setShowReviewAgent] = useState(false)
  const [extractedVariables, setExtractedVariables] = useState([])

  // Auto-layout handler
  const handleAutoLayout = useCallback(() => {
    const styledNodes = nodes.map(createStyledNode)
    const layoutedNodes = getLayoutedNodes(styledNodes, edges, 'LR')
    setNodes(layoutedNodes)
  }, [nodes, edges, setNodes])

  const onConnect = useCallback(
    (params) => {
      const newEdge = createStyledEdge(
        { id: `e${params.source}-${params.target}`, ...params },
        'direct'
      )
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const updateNode = useCallback((id, data) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== id) return node
        const updated = { ...node, data: { ...node.data, ...data } }
        return createStyledNode(updated)
      })
    )
  }, [setNodes])

  const addNode = useCallback((newNode) => {
    const styled = createStyledNode(newNode)
    const layouted = getLayoutedNodes([...nodes, styled], edges, 'LR')
    const addedNode = layouted[layouted.length - 1]
    setNodes(layouted)
  }, [nodes, edges, setNodes])

  const deleteNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  const handleExportEvidence = useCallback((evidence) => {
    setExtractedVariables(evidence.variables || [])
    if (evidence.variables?.length > 0) {
      const newNodes = evidence.variables.map((v, i) => {
        const colors = NODE_COLORS[v.type] || NODE_COLORS.other
        return {
          id: `var-${i}-${Date.now()}`,
          position: { x: 0, y: 0 },
          data: { label: v.name, role: v.type, source: 'review-agent' },
        }
      })
      const styledNewNodes = newNodes.map(createStyledNode)
      const allNodes = [...nodes, ...styledNewNodes]
      const layouted = getLayoutedNodes(allNodes, edges, 'LR')
      setNodes(layouted)
    }
  }, [nodes, edges, setNodes])

  // Apply styling to all nodes before rendering
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      if (node.style) return node // Already styled
      return createStyledNode(node)
    })
  }, [nodes])

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center px-4 gap-4 shrink-0">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">
          DAG-WB
        </h1>
        <ModeSelector mode={mode} setMode={setMode} />
        <div className="flex-1" />
        <button
          onClick={handleAutoLayout}
          className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors"
          title="自动布局 (暴露→结局)"
        >
          ⚡ 自动布局
        </button>
        <button
          onClick={() => setShowReviewAgent(true)}
          className="px-4 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
        >
          📚 文献综述Agent
        </button>
        <button
          onClick={() => setShowExport(true)}
          className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
        >
          导出
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar Sidebar */}
        <Toolbar
          mode={mode}
          onAddNode={addNode}
          onClear={() => {
            setNodes([])
            setEdges([])
          }}
          nodeColors={NODE_COLORS}
        />

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={styledNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            className="bg-slate-50 dark:bg-slate-900"
            defaultEdgeOptions={{
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed },
            }}
          >
            <Controls className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <MiniMap
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              nodeColor={(n) => n.style?.background || '#e2e8f0'}
            />
            <Background color="#cbd5e1" gap={20} variant={BackgroundVariant.Dots} />
            <Panel position="top-right" className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm shadow-lg">
              <div className="text-slate-600 dark:text-slate-300 space-y-1">
                <div>💡 点击节点编辑 | 📚 文献综述Agent导入变量</div>
                <div>➡️ 拖拽节点连接 = 添加因果箭头</div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-[#fef3c7] border-2 border-[#f59e0b]"></span>暴露
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-[#dbeafe] border-2 border-[#3b82f6]"></span>结局
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-[#fce7f3] border-2 border-[#ec4899]"></span>混杂
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-[#d1fae5] border-2 border-[#10b981]"></span>中介
                  </span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Node Editor Panel */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            mode={mode}
            nodeColors={NODE_COLORS}
            edgeStyles={EDGE_STYLES}
            onUpdate={(data) => updateNode(selectedNode.id, data)}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {/* Export Panel */}
        {showExport && (
          <ExportPanel
            nodes={nodes}
            edges={edges}
            onClose={() => setShowExport(false)}
          />
        )}

        {/* Review Agent Panel */}
        {showReviewAgent && (
          <div className="w-[500px] border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-medium">📚 文献综述Agent</h2>
              <button
                onClick={() => setShowReviewAgent(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ReviewAgent
                mode={mode}
                onExportEvidence={handleExportEvidence}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
