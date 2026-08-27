export function serializeGraphContext(graph, focus) {
  const lines = []
  lines.push(`Diagram: ${graph.title}`)
  lines.push(`Type: ${graph.diagramType}`)
  lines.push(`Summary: ${graph.summary}`)
  lines.push('')
  lines.push(`NODES (${graph.nodes.length}):`)
  for (const node of graph.nodes) {
    const pos = `(${(node.x * 100).toFixed(1)}%, ${(node.y * 100).toFixed(1)}%)`
    lines.push(`- ${node.label} [${node.type}] at ${pos}`)
  }
  lines.push('')
  lines.push(`EDGES (${graph.edges.length}):`)
  for (const edge of graph.edges) {
    const source = graph.nodes.find((n) => n.id === edge.source)?.label || edge.source
    const target = graph.nodes.find((n) => n.id === edge.target)?.label || edge.target
    const rel = edge.relationship ? `, ${edge.relationship}` : ''
    const label = edge.label ? ` labeled "${edge.label}"` : ''
    lines.push(`- ${source} ${edge.directed ? '→' : '—'} ${target}${label}${rel}`)
  }

  if (focus) {
    lines.push('')
    lines.push('FOCUS:')
    if (focus.type === 'diagram') {
      lines.push('The user is asking about the whole diagram.')
    } else if (focus.type === 'node') {
      const node = graph.nodes.find((n) => n.id === focus.id)
      if (node) {
        const neighbors = graph.edges
          .filter((e) => e.source === node.id || e.target === node.id)
          .map((e) => {
            const otherId = e.source === node.id ? e.target : e.source
            const other = graph.nodes.find((n) => n.id === otherId)
            return other ? `${other.label} (${e.label || e.relationship || 'connected'})` : otherId
          })
        lines.push(`Element: ${node.label} [${node.type}]`)
        if (node.description) lines.push(`Description: ${node.description}`)
        lines.push(`Connections: ${neighbors.join('; ') || 'none'}`)
      }
    } else if (focus.type === 'edge') {
      const edge = graph.edges.find((e) => e.id === focus.id)
      if (edge) {
        const source = graph.nodes.find((n) => n.id === edge.source)?.label || edge.source
        const target = graph.nodes.find((n) => n.id === edge.target)?.label || edge.target
        lines.push(`Connection: ${source} ${edge.directed ? '→' : '—'} ${target}`)
        if (edge.label) lines.push(`Label: ${edge.label}`)
        if (edge.relationship) lines.push(`Relationship: ${edge.relationship}`)
      }
    }
  }

  return lines.join('\n')
}
