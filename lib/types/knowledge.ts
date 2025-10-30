export interface KnowledgeNode {
  id: string
  label: string
  type: 'topic' | 'website' | 'action' | 'preference'
  connections: string[]
  strength: number
  position?: { x: number; y: number }
  tags?: string[]
  data?: {
    description?: string
    url?: string
    frequency?: number
    lastAccessed?: Date
    category?: string
  }
}

export interface KnowledgeEdge {
  id: string
  source: string
  target: string
  strength: number
  type: 'related' | 'derived' | 'similar' | 'sequence'
  data?: {
    weight?: number
    confidence?: number
    createdAt?: Date
  }
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  metadata: {
    totalNodes: number
    totalEdges: number
    lastUpdated: Date
    version: string
  }
}

export interface GraphFilters {
  nodeTypes: string[]
  strengthRange: [number, number]
  timeRange?: [Date, Date]
  searchQuery?: string
}

export interface GraphLayout {
  algorithm: 'force' | 'hierarchical' | 'circular' | 'grid'
  spacing: number
  iterations: number
}