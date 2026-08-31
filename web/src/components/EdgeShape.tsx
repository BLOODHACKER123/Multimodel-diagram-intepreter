import type { DiagramGraph, GraphEdge } from '../types/graph'
import { toViewBoxX, toViewBoxY, nodeCenter, boundaryPoint } from '../utils/geometry'
import { ariaLabelForEdge } from '../utils/describe'

interface EdgeShapeProps {
  edge: GraphEdge
  graph: DiagramGraph
  aspectRatio: number
  isFocused: boolean
  onFocus: () => void
}

export function EdgeShape({ edge, graph, aspectRatio, isFocused, onFocus }: EdgeShapeProps) {
  const source = graph.nodes.find((n) => n.id === edge.source)
  const target = graph.nodes.find((n) => n.id === edge.target)
  if (!source || !target) return null

  const sourceCenter = nodeCenter(source, aspectRatio)
  const targetCenter = nodeCenter(target, aspectRatio)
  const waypoints = (edge.waypoints || []).map((p) => ({ x: toViewBoxX(p.x), y: toViewBoxY(p.y, aspectRatio) }))

  const sourceDir = waypoints.length > 0
    ? { x: waypoints[0].x - sourceCenter.x, y: waypoints[0].y - sourceCenter.y }
    : { x: targetCenter.x - sourceCenter.x, y: targetCenter.y - sourceCenter.y }
  const targetDir = waypoints.length > 0
    ? { x: waypoints[waypoints.length - 1].x - targetCenter.x, y: waypoints[waypoints.length - 1].y - targetCenter.y }
    : { x: sourceCenter.x - targetCenter.x, y: sourceCenter.y - targetCenter.y }

  const from = boundaryPoint(source, aspectRatio, sourceDir)
  const to = boundaryPoint(target, aspectRatio, targetDir)

  const points = [from.x, from.y]
    .concat(waypoints.flatMap((p) => [p.x, p.y]))
    .concat([to.x, to.y])

  const d = `M ${points[0]} ${points[1]} ` + points.slice(2).reduce((acc, val, i, arr) => {
    if (i % 2 === 0) return acc + `L ${val} ${arr[i + 1]} `
    return acc
  }, '')

  const dash = edge.style === 'dashed' ? '8,6' : edge.style === 'dotted' ? '2,4' : undefined
  const marker = edge.directed ? 'url(#arrowhead)' : undefined

  const labelX = (from.x + to.x) / 2
  const labelY = (from.y + to.y) / 2

  return (
    <g data-edge-id={edge.id} className={`edge-shape ${isFocused ? 'focused' : ''}`}>
      <path
        d={d}
        className="edge-hit"
        stroke="transparent"
        strokeWidth={24}
        fill="none"
        role="button"
        tabIndex={0}
        aria-label={ariaLabelForEdge(edge, graph)}
        onFocus={onFocus}
        onClick={onFocus}
      />
      <path
        d={d}
        className="edge-visible"
        stroke={isFocused ? 'var(--focus-color)' : 'var(--edge-color)'}
        strokeWidth={3}
        fill="none"
        markerEnd={marker}
        strokeDasharray={dash}
        pointerEvents="none"
      />
      {edge.label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="edge-label"
        >
          {edge.label}
        </text>
      )}
    </g>
  )
}
