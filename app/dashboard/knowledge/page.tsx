'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../../components/layout/DashboardLayout'
import KnowledgeGraph from '../../../components/knowledge/KnowledgeGraph'
import { useKnowledgeNodes } from '../../../lib/hooks/use-real-time-sync'
import { KnowledgeNode, KnowledgeEdge } from '../../../lib/types/knowledge'
import { 
  EyeIcon,
  ChartBarIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Mock edges for demonstration (in real app, these would come from the knowledge nodes' connections)
const mockEdges: KnowledgeEdge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    strength: 0.8,
    type: 'related'
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    strength: 0.7,
    type: 'related'
  },
  {
    id: 'e1-4',
    source: '1',
    target: '4',
    strength: 0.6,
    type: 'derived'
  },
  {
    id: 'e2-5',
    source: '2',
    target: '5',
    strength: 0.4,
    type: 'similar'
  },
  {
    id: 'e3-6',
    source: '3',
    target: '6',
    strength: 0.5,
    type: 'sequence'
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    strength: 0.9,
    type: 'related'
  }
]

export default function KnowledgePage() {
  const {
    data: nodes,
    isLoading,
    error,
    syncStatus,
    refresh
  } = useKnowledgeNodes()

  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)

  // Generate edges from node connections
  const edges = useMemo(() => {
    const generatedEdges: KnowledgeEdge[] = []
    
    nodes.forEach(node => {
      if (node.connections) {
        node.connections.forEach(targetId => {
          const targetNode = nodes.find(n => n.id === targetId)
          if (targetNode) {
            generatedEdges.push({
              id: `e${node.id}-${targetId}`,
              source: node.id,
              target: targetId,
              strength: Math.min(node.strength, targetNode.strength),
              type: 'related'
            })
          }
        })
      }
    })
    
    return generatedEdges
  }, [nodes])

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node)
  }

  const handleNodeDoubleClick = (node: KnowledgeNode) => {
    // Handle double click - could open detailed view
    console.log('Double clicked node:', node)
  }

  const refreshGraph = async () => {
    try {
      await refresh()
    } catch (error) {
      console.error('Failed to refresh knowledge graph:', error)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <ArrowPathIcon className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your knowledge graph...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Knowledge Graph</h1>
            <p className="text-gray-400">
              Explore your learned preferences and behavioral patterns
            </p>
            
            {/* Sync Status Indicator */}
            {syncStatus && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  syncStatus.isOnline 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  <WifiIcon className="h-3 w-3" />
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </div>
                
                {syncStatus.unsyncedItems > 0 && (
                  <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400">
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    {syncStatus.unsyncedItems} unsynced
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={refreshGraph}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <EyeIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Nodes</p>
                <p className="text-xl font-bold text-white">{nodes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Connections</p>
                <p className="text-xl font-bold text-white">{edges.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <EyeIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Strong Links</p>
                <p className="text-xl font-bold text-white">
                  {edges.filter(e => e.strength > 0.7).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600/20 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Categories</p>
                <p className="text-xl font-bold text-white">
                  {new Set(nodes.map(n => n.type)).size}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/30 backdrop-blur-sm rounded-xl border border-red-800/50 p-6"
          >
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              <div>
                <h3 className="text-lg font-medium text-red-300">Sync Error</h3>
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Knowledge Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6"
        >
          <div className="h-96 w-full">
            {nodes.length > 0 ? (
              <KnowledgeGraph
                nodes={nodes}
                edges={edges}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
              />
            ) : !isLoading && !error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <EyeIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No knowledge data yet</h3>
                  <p className="text-gray-500">
                    Start browsing with the Kiro extension to build your knowledge graph
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Legend</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Node Types</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500/20 border-2 border-blue-500/50 rounded"></div>
                  <span className="text-sm text-gray-300">Topics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500/20 border-2 border-green-500/50 rounded"></div>
                  <span className="text-sm text-gray-300">Websites</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500/20 border-2 border-red-500/50 rounded"></div>
                  <span className="text-sm text-gray-300">Actions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-500/20 border-2 border-purple-500/50 rounded"></div>
                  <span className="text-sm text-gray-300">Preferences</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Connection Types</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-0.5 bg-blue-500"></div>
                  <span className="text-sm text-gray-300">Related</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-0.5 bg-green-500"></div>
                  <span className="text-sm text-gray-300">Derived</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-0.5 bg-yellow-500"></div>
                  <span className="text-sm text-gray-300">Similar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-0.5 bg-purple-500"></div>
                  <span className="text-sm text-gray-300">Sequence</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}