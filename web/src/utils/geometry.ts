import type { Point, GraphNode, GraphEdge } from '../types/graph'

export const VIEWBOX_WIDTH = 1000

export function toViewBoxX(x: number): number {
  return x * VIEWBOX_WIDTH
}

export function toViewBoxY(y: number, aspectRatio: number): number {
  return y * VIEWBOX_WIDTH * aspectRatio
}

export function fromViewBox(point: Point, aspectRatio: number): Point {
  return {
    x: point.x / VIEWBOX_WIDTH,
    y: point.y / (VIEWBOX_WIDTH * aspectRatio),
  }
}

export function nodeCenter(node: GraphNode, aspectRatio: number): Point {
  return {
    x: toViewBoxX(node.x),
    y: toViewBoxY(node.y, aspectRatio),
  }
}

export function nodeRect(node: GraphNode, aspectRatio: number): { x: number; y: number; width: number; height: number } {
  const w = Math.max(node.width || 0.08, 0.04) * VIEWBOX_WIDTH
  const h = Math.max(node.height || 0.06, 0.04) * VIEWBOX_WIDTH * aspectRatio
  const cx = toViewBoxX(node.x)
  const cy = toViewBoxY(node.y, aspectRatio)
  return { x: cx - w / 2, y: cy - h / 2, width: w, height: h }
}

export function distanceToNode(point: Point, node: GraphNode, aspectRatio: number): number {
  const rect = nodeRect(node, aspectRatio)
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width))
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height))
  return Math.sqrt(dx * dx + dy * dy)
}

export function edgeLine(edge: GraphEdge, graph: { nodes: GraphNode[] }, aspectRatio: number): { x1: number; y1: number; x2: number; y2: number } {
  const source = graph.nodes.find((n) => n.id === edge.source)
  const target = graph.nodes.find((n) => n.id === edge.target)
  if (!source || !target) return { x1: 0, y1: 0, x2: 0, y2: 0 }
  const from = nodeCenter(source, aspectRatio)
  const to = nodeCenter(target, aspectRatio)
  return { x1: from.x, y1: from.y, x2: to.x, y2: to.y }
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby || 1)))
  const projX = a.x + t * abx
  const projY = a.y + t * aby
  return Math.hypot(p.x - projX, p.y - projY)
}

export function distanceToEdge(point: Point, edge: GraphEdge, graph: { nodes: GraphNode[] }, aspectRatio: number): number {
  const source = graph.nodes.find((n) => n.id === edge.source)
  const target = graph.nodes.find((n) => n.id === edge.target)
  if (!source || !target) return Infinity
  const from = nodeCenter(source, aspectRatio)
  const to = nodeCenter(target, aspectRatio)
  if (edge.waypoints && edge.waypoints.length) {
    const points = [from, ...edge.waypoints.map((p) => ({ x: toViewBoxX(p.x), y: toViewBoxY(p.y, aspectRatio) })), to]
    let min = Infinity
    for (let i = 0; i < points.length - 1; i++) {
      min = Math.min(min, distanceToSegment(point, points[i], points[i + 1]))
    }
    return min
  }
  return distanceToSegment(point, from, to)
}
