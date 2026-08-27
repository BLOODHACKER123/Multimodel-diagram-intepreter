export interface Point {
  x: number
  y: number
}

export interface GraphNode {
  id: string
  label: string
  type: 'entity' | 'attribute' | 'process' | 'service' | 'database' | 'decision' | 'state' | 'group' | 'actor' | 'other'
  shape: 'rect' | 'rounded' | 'ellipse' | 'circle' | 'diamond' | 'cylinder' | 'cloud'
  x: number
  y: number
  width?: number
  height?: number
  group?: string
  description?: string
  meta?: Record<string, string>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  directed: boolean
  relationship?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' | 'contains' | 'flows-to' | 'depends-on' | 'inherits' | 'other'
  weight?: number
  waypoints?: Point[]
  style?: 'solid' | 'dashed' | 'dotted'
}

export interface DiagramGraph {
  id: string
  title: string
  diagramType: 'er' | 'graph' | 'flowchart' | 'cloud-architecture' | 'uml' | 'network' | 'other'
  summary: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  imageSize: { width: number; height: number }
  legend?: string[]
}

export interface ExtractionResult {
  diagramId: string
  graph: DiagramGraph
  confidence: number
  warnings: string[]
  provider: string
  model: string
}

export interface AskRequest {
  question: string
  diagramId?: string
  graph?: DiagramGraph
  focus?: { type: 'node' | 'edge' | 'diagram'; id?: string }
  history?: { role: 'user' | 'assistant'; content: string }[]
}

export interface AskResponse {
  answer: string
  followUps: string[]
}

export interface Focus {
  type: 'node' | 'edge' | 'diagram'
  id?: string
}
