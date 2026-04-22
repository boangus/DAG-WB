import React, { useState, useCallback } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { DAGCanvas } from './components/DAGCanvas'
import { Toolbar } from './components/Toolbar'
import { NodeEditor } from './components/NodeEditor'
import { ExportPanel } from './components/ExportPanel'
import { ModeSelector } from './components/ModeSelector'

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: '暴露因素 (E)' }, style: { background: '#fef3c7', border: '2px solid #f59e0b' } },
  { id: '2', position: { x: 100, y: 250 }, data: { label: '结局 (Y)' }, style: { background: '#dbeafe', border: '2px solid #3b82f6' } },
  { id: '3', position: { x: 350, y: 175 }, data: { label: '混杂因素 (C)' }, style: { background: '#fce7f3', border: '2px solid #ec4899' } },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: '直接效应', style: { stroke: '#2563eb' } },
  { id: 'e1-3', source: '1', target: '3', style: { stroke: '#94a3b8', strokeDasharray: '5,5' } },
  { id: 'e3-2', source: '3', target: '2', label: '混杂', style: { stroke: '#7c3aed' } },
]

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState(null)
  const [mode, setMode] = useState('western') // 'western' | 'tcm'
  const [showExport, setShowExport] = useState(false)

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const updateNode = useCallback((id, data) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      )
    )
  }, [setNodes])

  const addNode = useCallback((newNode) => {
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const deleteNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center px-4 gap-4 shrink-0">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">
          DAG-WB 有向无环图绘制平台
        </h1>
        <ModeSelector mode={mode} setMode={setMode} />
        <div className="flex-1" />
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
        />

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            className="bg-slate-50 dark:bg-slate-900"
          >
            <Controls className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <MiniMap
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              nodeColor={(n) => n.style?.background || '#e2e8f0'}
            />
            <Background color="#cbd5e1" gap={20} />
            <Panel position="top-right" className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
              <div className="text-slate-600 dark:text-slate-300">
                💡 点击节点编辑，双击画布新建节点，拖拽连接
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Node Editor Panel */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            mode={mode}
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
      </div>
    </div>
  )
}
