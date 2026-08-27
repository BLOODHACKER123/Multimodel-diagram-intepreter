import type { DiagramGraph, GraphNode, GraphEdge } from '../types/graph'

export function describeNode(node: GraphNode, graph: DiagramGraph): string {
  const outgoing = graph.edges.filter((e) => e.source === node.id)
  const incoming = graph.edges.filter((e) => e.target === node.id)
  const degree = outgoing.length + incoming.length

  const connections = []
  if (outgoing.length) {
    connections.push(`outgoing to ${outgoing.map((e) => labelFor(e.target, graph)).join(', ')}`)
  }
  if (incoming.length) {
    connections.push(`incoming from ${incoming.map((e) => labelFor(e.source, graph)).join(', ')}`)
  }

  const parts = [`${node.label}, ${node.type}`]
  if (node.description) parts.push(node.description)
  if (degree) {
    parts.push(`${degree} connection${degree === 1 ? '' : 's'}${connections.length ? ': ' + connections.join('; ') : ''}`)
  }
  return parts.join('. ')
}

export function describeEdge(edge: GraphEdge, graph: DiagramGraph): string {
  const source = labelFor(edge.source, graph)
  const target = labelFor(edge.target, graph)
  const connector = edge.directed ? 'to' : 'and'
  const label = edge.label ? ` labeled ${edge.label}` : ''
  const relationship = edge.relationship ? `, ${edge.relationship.replace(/-/g, ' ')}` : ''
  const weight = typeof edge.weight === 'number' ? `, weight ${edge.weight}` : ''
  return `Connection from ${source} ${connector} ${target}${label}${relationship}${weight}`
}

export function describeDiagram(graph: DiagramGraph): string {
  return `${graph.title}. ${graph.summary} ${graph.nodes.length} nodes, ${graph.edges.length} connections.`
}

function labelFor(id: string, graph: DiagramGraph): string {
  return graph.nodes.find((n) => n.id === id)?.label || id
}

export function ariaLabelForNode(node: GraphNode, graph: DiagramGraph): string {
  const degree = graph.edges.filter((e) => e.source === node.id || e.target === node.id).length
  return `${node.label}, ${node.type}${degree ? `, ${degree} connections` : ''}`
}

export function ariaLabelForEdge(edge: GraphEdge, graph: DiagramGraph): string {
  return describeEdge(edge, graph)
}
