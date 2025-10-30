'use client'

import { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  MiniMap,
  NodeTypes,
  EdgeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { KnowledgeNode as KnowledgeNodeType, KnowledgeEdge, GraphFilters } from '../../lib/types/knowledge'
import CustomNode from './CustomNode'
import CustomEdge from './CustomEdge'
import GraphControls from './GraphControls'

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
}

interface KnowledgeGraphProps {
  nodes: KnowledgeNodeType[]
  edges: KnowledgeEdge[]
  onNodeClick?: (node: KnowledgeNodeType) => void
  onNodeDoubleClick?: (node: KnowledgeNodeType) => void
  className?: string
}

export default function KnowledgeGraph({ 
  nodes: initialNodes, 
  edges: initialEdges, 
  onNodeClick,
  onNodeDoubleClick,
  className = ''
}: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeType | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [filters, setFilters] = useState<GraphFilters>({
    nodeTypes: ['topic', 'website', 'action', 'preference'],
    strengthRange: [0, 1],
    searchQuery: ''
  })

  // Convert knowledge nodes to React Flow nodes
  const convertToFlowNodes = useCallback((knowledgeNodes: KnowledgeNodeType[]): Node[] => {
    return knowledgeNodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: node.position || { 
        x: Math.random() * 800, 
        y: Math.random() * 600 
      },
      data: {
        ...node,
        onClick: () => {
          setSelectedNode(node)
          onNodeClick?.(node)
        },
        onDoubleClick: () => onNodeDoubleClick?.(node)
      },
      style: {
        background: getNodeColor(node.type),
        border: `2px solid ${getNodeBorderColor(node.type)}`,
        borderRadius: '12px',
        padding: '10px',
        minWidth: '120px',
      }
    }))
  }, [onNodeClick, onNodeDoubleClick])

  // Convert knowledge edges to React Flow edges
  const convertToFlowEdges = useCallback((knowledgeEdges: KnowledgeEdge[]): Edge[] => {
    return knowledgeEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'custom',
      data: edge,
      style: {
        strokeWidth: Math.max(1, edge.strength * 4),
        stroke: getEdgeColor(edge.type),
        opacity: 0.6 + (edge.strength * 0.4)
      },
      animated: edge.strength > 0.7
    }))
  }, [])

  // Apply filters to nodes and edges
  const applyFilters = useCallback(() => {
    let filteredNodes = initialNodes.filter(node => {
      // Filter by node type
      if (!filters.nodeTypes.includes(node.type)) return false
      
      // Filter by strength
      if (node.strength < filters.strengthRange[0] || node.strength > filters.strengthRange[1]) return false
      
      // Filter by search query
      if (filters.searchQuery && !node.label.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false
      }
      
      return true
    })

    let filteredEdges = initialEdges.filter(edge => {
      // Only include edges where both nodes are visible
      const sourceVisible = filteredNodes.some(n => n.id === edge.source)
      const targetVisible = filteredNodes.some(n => n.id === edge.target)
      return sourceVisible && targetVisible
    })

    setNodes(convertToFlowNodes(filteredNodes))
    setEdges(convertToFlowEdges(filteredEdges))
  }, [initialNodes, initialEdges, filters, convertToFlowNodes, convertToFlowEdges])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const getNodeColor = (type: string) => {
    const colors = {
      topic: 'rgba(59, 130, 246, 0.1)',
      website: 'rgba(16, 185, 129, 0.1)',
      action: 'rgba(245, 101, 101, 0.1)',
      preference: 'rgba(139, 92, 246, 0.1)'
    }
    return colors[type as keyof typeof colors] || 'rgba(107, 114, 128, 0.1)'
  }

  const getNodeBorderColor = (type: string) => {
    const colors = {
      topic: 'rgba(59, 130, 246, 0.5)',
      website: 'rgba(16, 185, 129, 0.5)',
      action: 'rgba(245, 101, 101, 0.5)',
      preference: 'rgba(139, 92, 246, 0.5)'
    }
    return colors[type as keyof typeof colors] || 'rgba(107, 114, 128, 0.5)'
  }

  const getEdgeColor = (type: string) => {
    const colors = {
      related: '#3B82F6',
      derived: '#10B981',
      similar: '#F59E0B',
      sequence: '#8B5CF6'
    }
    return colors[type as keyof typeof colors] || '#6B7280'
  }

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className={`relative h-full w-full bg-gray-950 rounded-xl overflow-hidden ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-950"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="rgba(255, 255, 255, 0.1)"
        />
        
        <Controls 
          className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg"
          showInteractive={false}
        />
        
        <MiniMap 
          className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg"
          nodeColor={(node) => getNodeBorderColor(node.data.type)}
          maskColor="rgba(0, 0, 0, 0.8)"
        />

        {/* Search and Filter Panel */}
        <Panel position="top-left" className="m-4">
          <div className="flex gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-10 pr-4 py-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
        </Panel>

        {/* Node Info Panel */}
        <Panel position="top-right" className="m-4">
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 min-w-64"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{selectedNode.label}</h3>
                    <p className="text-sm text-gray-400 capitalize">{selectedNode.type}</p>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Strength:</span>
                    <span className="text-white">{(selectedNode.strength * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connections:</span>
                    <span className="text-white">{selectedNode.connections.length}</span>
                  </div>
                  {selectedNode.data?.description && (
                    <div>
                      <span className="text-gray-400">Description:</span>
                      <p className="text-white mt-1">{selectedNode.data.description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        {/* Stats Panel */}
        <Panel position="bottom-right" className="m-4">
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{nodes.length} nodes</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{edges.length} edges</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Advanced Controls */}
      <AnimatePresence>
        {showControls && (
          <GraphControls
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowControls(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}