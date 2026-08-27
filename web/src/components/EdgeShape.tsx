import type { DiagramGraph, GraphEdge } from '../types/graph'
import { toViewBoxX, toViewBoxY } from '../utils/geometry'
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

  const x1 = toViewBoxX(source.x)
  const y1 = toViewBoxY(source.y, aspectRatio)
  const x2 = toViewBoxX(target.x)
  const y2 = toViewBoxY(target.y, aspectRatio)

  const points = [x1, y1]
    .concat((edge.waypoints || []).flatMap((p) => [toViewBoxX(p.x), toViewBoxY(p.y, aspectRatio)]))
    .concat([x2, y2])

  const d = `M ${points[0]} ${points[1]} ` + points.slice(2).reduce((acc, val, i, arr) => {
    if (i % 2 === 0) return acc + `L ${val} ${arr[i + 1]} `
    return acc
  }, '')

  const dash = edge.style === 'dashed' ? '8,6' : edge.style === 'dotted' ? '2,4' : undefined
  const marker = edge.directed ? 'url(#arrowhead)' : undefined

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
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2}
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
