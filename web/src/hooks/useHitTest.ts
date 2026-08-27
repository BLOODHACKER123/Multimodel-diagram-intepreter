import { useCallback, useRef } from 'react'
import type { DiagramGraph, GraphNode, GraphEdge, Point } from '../types/graph'
import { distanceToNode, distanceToEdge, fromViewBox, toViewBoxX, toViewBoxY } from '../utils/geometry'

export function useHitTest(graph: DiagramGraph | null, svgRef: React.RefObject<SVGSVGElement | null>) {
  const lastHitRef = useRef<string | null>(null)

  const svgToPoint = useCallback((clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const screenPt = pt.matrixTransform(ctm.inverse())
    const aspectRatio = (graph?.imageSize.height || 1) / (graph?.imageSize.width || 1)
    return fromViewBox(screenPt, aspectRatio)
  }, [svgRef, graph])

  const hitTest = useCallback((clientX: number, clientY: number): { type: 'node' | 'edge' | null; id: string | null } => {
    if (!graph) return { type: null, id: null }

    // Prefer native elementFromPoint for elements
    const svg = svgRef.current
    if (svg) {
      const el = document.elementFromPoint(clientX, clientY)
      const nodeId = el?.closest('[data-node-id]')?.getAttribute('data-node-id')
      const edgeId = el?.closest('[data-edge-id]')?.getAttribute('data-edge-id')
      if (nodeId) return { type: 'node', id: nodeId }
      if (edgeId) return { type: 'edge', id: edgeId }
    }

    const normPt = svgToPoint(clientX, clientY)
    if (!normPt) return { type: null, id: null }

    const aspectRatio = graph.imageSize.height / graph.imageSize.width

    // Nearest node within tolerance
    let bestNode: { node: GraphNode; dist: number } | null = null
    for (const node of graph.nodes) {
      const dist = distanceToNode({ x: toViewBoxX(normPt.x), y: toViewBoxY(normPt.y, aspectRatio) }, node, aspectRatio)
      if (!bestNode || dist < bestNode.dist) bestNode = { node, dist }
    }

    if (bestNode && bestNode.dist < 40) {
      return { type: 'node', id: bestNode.node.id }
    }

    // Nearest edge within tolerance
    let bestEdge: { edge: GraphEdge; dist: number } | null = null
    for (const edge of graph.edges) {
      const dist = distanceToEdge({ x: toViewBoxX(normPt.x), y: toViewBoxY(normPt.y, aspectRatio) }, edge, graph, aspectRatio)
      if (!bestEdge || dist < bestEdge.dist) bestEdge = { edge, dist }
    }

    if (bestEdge && bestEdge.dist < 30) {
      return { type: 'edge', id: bestEdge.edge.id }
    }

    return { type: null, id: null }
  }, [graph, svgRef, svgToPoint])

  const hasChanged = useCallback((id: string | null) => {
    if (lastHitRef.current === id) return false
    lastHitRef.current = id
    return true
  }, [])

  return { hitTest, hasChanged, svgToPoint }
}
