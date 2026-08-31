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

export function boundaryPoint(node: GraphNode, aspectRatio: number, direction: Point): Point {
  const rect = nodeRect(node, aspectRatio)
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const dx = direction.x
  const dy = direction.y
  const dirLen = Math.hypot(dx, dy)
  if (dirLen < 1e-9) {
    return { x: cx, y: cy }
  }

  if (node.shape === 'circle' || node.shape === 'ellipse' || node.shape === 'cloud') {
    const rx = rect.width / 2
    const ry = rect.height / 2
    const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    return { x: cx + dx * t, y: cy + dy * t }
  }

  if (node.shape === 'diamond') {
    const hw = rect.width / 2
    const hh = rect.height / 2
    const segments: [Point, Point][] = [
      [{ x: cx, y: cy - hh }, { x: cx + hw, y: cy }],
      [{ x: cx + hw, y: cy }, { x: cx, y: cy + hh }],
      [{ x: cx, y: cy + hh }, { x: cx - hw, y: cy }],
      [{ x: cx - hw, y: cy }, { x: cx, y: cy - hh }],
    ]
    let bestT = Infinity
    let bestP: Point = { x: cx, y: cy }
    for (const [a, b] of segments) {
      const abx = b.x - a.x
      const aby = b.y - a.y
      const denom = dx * aby - dy * abx
      if (Math.abs(denom) < 1e-9) continue
      const acx = a.x - cx
      const acy = a.y - cy
      const t = (acx * aby - acy * abx) / denom
      const u = (acx * dy - acy * dx) / denom
      if (t >= 0 && u >= 0 && u <= 1 && t < bestT) {
        bestT = t
        bestP = { x: cx + t * dx, y: cy + t * dy }
      }
    }
    return bestP
  }

  let tmin = -Infinity
  let tmax = Infinity
  if (Math.abs(dx) > 1e-9) {
    const tx1 = (rect.x - cx) / dx
    const tx2 = (rect.x + rect.width - cx) / dx
    tmin = Math.max(tmin, Math.min(tx1, tx2))
    tmax = Math.min(tmax, Math.max(tx1, tx2))
  } else if (cx < rect.x || cx > rect.x + rect.width) {
    return { x: cx, y: cy }
  }
  if (Math.abs(dy) > 1e-9) {
    const ty1 = (rect.y - cy) / dy
    const ty2 = (rect.y + rect.height - cy) / dy
    tmin = Math.max(tmin, Math.min(ty1, ty2))
    tmax = Math.min(tmax, Math.max(ty1, ty2))
  } else if (cy < rect.y || cy > rect.y + rect.height) {
    return { x: cx, y: cy }
  }
  if (tmax < 0) return { x: cx, y: cy }
  const t = tmax
  return { x: cx + t * dx, y: cy + t * dy }
}

export function distanceToNode(point: Point, node: GraphNode, aspectRatio: number): number {
  const rect = nodeRect(node, aspectRatio)
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width))
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height))
  return Math.sqrt(dx * dx + dy * dy)
}

function edgeWaypoints(edge: GraphEdge, aspectRatio: number): Point[] {
  return (edge.waypoints || []).map((p) => ({ x: toViewBoxX(p.x), y: toViewBoxY(p.y, aspectRatio) }))
}

function edgeBoundaryEndpoints(
  edge: GraphEdge,
  graph: { nodes: GraphNode[] },
  aspectRatio: number
): { from: Point; to: Point; waypoints: Point[] } {
  const source = graph.nodes.find((n) => n.id === edge.source)
  const target = graph.nodes.find((n) => n.id === edge.target)
  if (!source || !target) {
    return { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, waypoints: [] }
  }
  const sourceCenter = nodeCenter(source, aspectRatio)
  const targetCenter = nodeCenter(target, aspectRatio)
  const waypoints = edgeWaypoints(edge, aspectRatio)
  const sourceDir = waypoints.length > 0
    ? { x: waypoints[0].x - sourceCenter.x, y: waypoints[0].y - sourceCenter.y }
    : { x: targetCenter.x - sourceCenter.x, y: targetCenter.y - sourceCenter.y }
  const targetDir = waypoints.length > 0
    ? { x: waypoints[waypoints.length - 1].x - targetCenter.x, y: waypoints[waypoints.length - 1].y - targetCenter.y }
    : { x: sourceCenter.x - targetCenter.x, y: sourceCenter.y - targetCenter.y }
  const from = boundaryPoint(source, aspectRatio, sourceDir)
  const to = boundaryPoint(target, aspectRatio, targetDir)
  return { from, to, waypoints }
}

export function edgeLine(edge: GraphEdge, graph: { nodes: GraphNode[] }, aspectRatio: number): { x1: number; y1: number; x2: number; y2: number } {
  const { from, to } = edgeBoundaryEndpoints(edge, graph, aspectRatio)
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
  const { from, to, waypoints } = edgeBoundaryEndpoints(edge, graph, aspectRatio)
  const points = [from, ...waypoints, to]
  let min = Infinity
  for (let i = 0; i < points.length - 1; i++) {
    min = Math.min(min, distanceToSegment(point, points[i], points[i + 1]))
  }
  return min
}
