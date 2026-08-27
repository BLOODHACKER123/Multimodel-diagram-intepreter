import { useCallback } from 'react'
import type { DiagramGraph, Focus } from '../types/graph'
import { nearestNodeInDirection, readingOrder } from '../utils/adjacency'

export function useGraphNavigation(
  graph: DiagramGraph | null,
  focus: Focus | null,
  setFocus: (focus: Focus) => void
) {
  const orderedIds = graph ? readingOrder(graph) : []

  const cycleFocus = useCallback((type: 'node' | 'edge' | 'diagram', id?: string) => {
    setFocus({ type, id })
  }, [setFocus])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (!graph) return

    const key = e.key
    const currentId = focus?.type === 'node' ? focus.id : undefined

    if (key === 'Tab') return // browser handles

    if (key === 'Home') {
      e.preventDefault()
      cycleFocus('diagram')
      return
    }

    if (key === 'n' || key === 'N') {
      e.preventDefault()
      if (!currentId) {
        cycleFocus('node', orderedIds[0])
        return
      }
      const idx = orderedIds.indexOf(currentId)
      cycleFocus('node', orderedIds[(idx + 1) % orderedIds.length])
      return
    }

    if (key === 'p' || key === 'P') {
      e.preventDefault()
      if (!currentId) {
        cycleFocus('node', orderedIds[orderedIds.length - 1])
        return
      }
      const idx = orderedIds.indexOf(currentId)
      cycleFocus('node', orderedIds[(idx - 1 + orderedIds.length) % orderedIds.length])
      return
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      e.preventDefault()
      const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[key] as 'up' | 'down' | 'left' | 'right'
      const startId = currentId || orderedIds[0]
      const nextId = startId ? nearestNodeInDirection(startId, direction, graph) : null
      if (nextId) cycleFocus('node', nextId)
      return
    }

    if (key === 'e' || key === 'E') {
      e.preventDefault()
      if (!currentId) return
      const edges = graph.edges.filter((edge) => edge.source === currentId || edge.target === currentId)
      if (!edges.length) return
      const currentEdgeId = focus?.type === 'edge' ? focus.id : undefined
      const idx = edges.findIndex((e) => e.id === currentEdgeId)
      const nextEdge = edges[(idx + 1) % edges.length]
      cycleFocus('edge', nextEdge.id)
    }

    if (key === 'q' || key === 'Q') {
      e.preventDefault()
      // Caller handles opening the dialog
    }
  }, [graph, focus, cycleFocus, orderedIds])

  return { handleKey, orderedIds }
}
