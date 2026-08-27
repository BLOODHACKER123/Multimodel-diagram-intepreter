import type { DiagramGraph, GraphNode } from '../types/graph'
import { nodeRect, toViewBoxX, toViewBoxY } from '../utils/geometry'
import { ariaLabelForNode } from '../utils/describe'

interface NodeShapeProps {
  node: GraphNode
  graph: DiagramGraph
  aspectRatio: number
  isFocused: boolean
  onFocus: () => void
}

export function NodeShape({ node, graph, aspectRatio, isFocused, onFocus }: NodeShapeProps) {
  const rect = nodeRect(node, aspectRatio)
  const rx = node.shape === 'rounded' || node.shape === 'circle' || node.shape === 'ellipse' ? Math.min(rect.width, rect.height) / 2 : 0

  let shape
  if (node.shape === 'circle' || node.shape === 'ellipse') {
    shape = (
      <ellipse
        cx={toViewBoxX(node.x)}
        cy={toViewBoxY(node.y, aspectRatio)}
        rx={rect.width / 2}
        ry={rect.height / 2}
      />
    )
  } else if (node.shape === 'diamond') {
    const cx = toViewBoxX(node.x)
    const cy = toViewBoxY(node.y, aspectRatio)
    const w = rect.width / 2
    const h = rect.height / 2
    shape = <polygon points={`${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`} />
  } else {
    shape = <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={rx} />
  }

  return (
    <g
      data-node-id={node.id}
      role="button"
      tabIndex={0}
      aria-label={ariaLabelForNode(node, graph)}
      className={`node-shape ${isFocused ? 'focused' : ''}`}
      onFocus={onFocus}
      onClick={onFocus}
    >
      {shape}
      <text
        x={toViewBoxX(node.x)}
        y={toViewBoxY(node.y, aspectRatio)}
        textAnchor="middle"
        dominantBaseline="middle"
        className="node-label"
      >
        {node.label}
      </text>
    </g>
  )
}
