import type { DiagramGraph, Focus } from '../types/graph'
import { describeNode, describeEdge, describeDiagram } from '../utils/describe'

interface InspectorPanelProps {
  graph: DiagramGraph
  focus: Focus
  onFocusChange: (focus: Focus) => void
  onAsk: () => void
}

export function InspectorPanel({ graph, focus, onFocusChange, onAsk }: InspectorPanelProps) {
  let title: string
  let description: string

  if (focus.type === 'diagram') {
    title = graph.title
    description = describeDiagram(graph)
  } else if (focus.type === 'node') {
    const node = graph.nodes.find((n) => n.id === focus.id)
    title = node ? node.label : 'Unknown'
    description = node ? describeNode(node, graph) : 'No description available.'
  } else {
    const edge = graph.edges.find((e) => e.id === focus.id)
    title = edge ? (edge.label || 'Connection') : 'Unknown'
    description = edge ? describeEdge(edge, graph) : 'No description available.'
  }

  return (
    <div className="inspector-panel" role="region" aria-label="Element inspector">
      <h2>{title}</h2>
      <p>{description}</p>
      {focus.type !== 'diagram' && (
        <button onClick={() => onFocusChange({ type: 'diagram' })}>Overview</button>
      )}
      <button onClick={onAsk} aria-label="Ask a question about this element">
        Ask about this
      </button>
    </div>
  )
}
