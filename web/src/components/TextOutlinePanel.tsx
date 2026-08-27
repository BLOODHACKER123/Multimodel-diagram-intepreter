import type { DiagramGraph, Focus } from '../types/graph'
import { describeEdge } from '../utils/describe'

interface TextOutlinePanelProps {
  graph: DiagramGraph
  focus: Focus
  onFocusChange: (focus: Focus) => void
}

export function TextOutlinePanel({ graph, focus, onFocusChange }: TextOutlinePanelProps) {
  return (
    <div className="outline-panel" role="region" aria-label="Text outline of diagram">
      <h3>Diagram outline</h3>
      <p>{graph.summary}</p>
      <ul>
        {graph.nodes.map((node) => {
          const nodeEdges = graph.edges.filter((e) => e.source === node.id || e.target === node.id)
          const isFocused = focus.type === 'node' && focus.id === node.id
          return (
            <li key={node.id} className={isFocused ? 'focused' : ''}>
              <button
                onClick={() => onFocusChange({ type: 'node', id: node.id })}
                aria-current={isFocused ? 'true' : undefined}
              >
                {node.label} <span className="type-tag">{node.type}</span>
              </button>
              {nodeEdges.length > 0 && (
                <ul>
                  {nodeEdges.map((edge) => {
                    const otherId = edge.source === node.id ? edge.target : edge.source
                    const other = graph.nodes.find((n) => n.id === otherId)
                    return (
                      <li key={edge.id}>
                        <button
                          onClick={() => onFocusChange({ type: 'edge', id: edge.id })}
                          aria-label={describeEdge(edge, graph)}
                        >
                          {edge.label || edge.relationship || 'connection'} → {other?.label || otherId}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
