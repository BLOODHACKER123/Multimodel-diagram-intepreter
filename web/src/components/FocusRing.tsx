import type { DiagramGraph, Focus } from '../types/graph'
import { nodeRect } from '../utils/geometry'

interface FocusRingProps {
  graph: DiagramGraph
  focus: Focus
  aspectRatio: number
}

export function FocusRing({ graph, focus, aspectRatio }: FocusRingProps) {
  if (focus.type === 'diagram') return null

  if (focus.type === 'node') {
    const node = graph.nodes.find((n) => n.id === focus.id)
    if (!node) return null
    const rect = nodeRect(node, aspectRatio)
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const baseR = Math.max(rect.width, rect.height) / 2 + 8

    return (
      <g pointerEvents="none">
        <rect
          x={rect.x - 6}
          y={rect.y - 6}
          width={rect.width + 12}
          height={rect.height + 12}
          fill="none"
          stroke="var(--focus-color)"
          strokeWidth={4}
          rx={node.shape === 'rounded' || node.shape === 'circle' || node.shape === 'ellipse' ? 999 : 0}
          className="focus-ring"
        />
        <circle cx={cx} cy={cy} r={baseR} className="ping-ring ping-ring-1" />
        <circle cx={cx} cy={cy} r={baseR} className="ping-ring ping-ring-2" />
      </g>
    )
  }

  if (focus.type === 'edge') {
    const edge = graph.edges.find((e) => e.id === focus.id)
    const source = graph.nodes.find((n) => n.id === edge?.source)
    const target = graph.nodes.find((n) => n.id === edge?.target)
    if (!edge || !source || !target) return null
    return (
      <line
        x1={source.x * 1000}
        y1={source.y * 1000 * aspectRatio}
        x2={target.x * 1000}
        y2={target.y * 1000 * aspectRatio}
        stroke="var(--focus-color)"
        strokeWidth={6}
        className="focus-ring"
        pointerEvents="none"
      />
    )
  }

  return null
}