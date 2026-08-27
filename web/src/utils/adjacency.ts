import type { DiagramGraph, GraphEdge } from '../types/graph'

export interface AdjacencyEntry {
  out: GraphEdge[]
  in: GraphEdge[]
  degree: number
}

export function buildAdjacency(graph: DiagramGraph): Map<string, AdjacencyEntry> {
  const map = new Map<string, AdjacencyEntry>()
  for (const node of graph.nodes) {
    map.set(node.id, { out: [], in: [], degree: 0 })
  }
  for (const edge of graph.edges) {
    if (!map.has(edge.source) || !map.has(edge.target)) continue
    map.get(edge.source)!.out.push(edge)
    map.get(edge.target)!.in.push(edge)
    map.get(edge.source)!.degree++
    map.get(edge.target)!.degree++
  }
  return map
}

export function readingOrder(graph: DiagramGraph): string[] {
  return [...graph.nodes]
    .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
    .map((n) => n.id)
}

export function nearestNodeInDirection(
  fromId: string,
  direction: 'up' | 'down' | 'left' | 'right',
  graph: DiagramGraph
): string | null {
  const from = graph.nodes.find((n) => n.id === fromId)
  if (!from) return null

  const candidates = graph.nodes.filter((n) => n.id !== fromId)
  let best: { id: string; dist: number } | null = null

  for (const n of candidates) {
    const dx = n.x - from.x
    const dy = n.y - from.y
    const inDirection =
      (direction === 'up' && dy < -0.02) ||
      (direction === 'down' && dy > 0.02) ||
      (direction === 'left' && dx < -0.02) ||
      (direction === 'right' && dx > 0.02)
    if (!inDirection) continue
    const dist = Math.hypot(dx, dy)
    if (!best || dist < best.dist) best = { id: n.id, dist }
  }

  return best?.id || null
}
