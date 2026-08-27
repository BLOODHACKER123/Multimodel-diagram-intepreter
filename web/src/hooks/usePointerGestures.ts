import { useRef, useCallback } from 'react'

interface GestureHandlers {
  onTap?: (id: string) => void
  onDoubleTap?: (id: string) => void
  onLongPress?: (id: string) => void
  onDragStart?: (id: string | null) => void
  onDragMove?: (id: string | null) => void
  onDragEnd?: (id: string | null) => void
}

export function usePointerGestures(handlers: GestureHandlers) {
  const stateRef = useRef({
    startId: null as string | null,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    lastTapId: null as string | null,
    longPressTimer: null as number | null,
    dragging: false,
    doubleTapPending: false,
  })

  const clearLongPress = useCallback(() => {
    if (stateRef.current.longPressTimer) {
      window.clearTimeout(stateRef.current.longPressTimer)
      stateRef.current.longPressTimer = null
    }
  }, [])

  const getId = useCallback((target: EventTarget | null): string | null => {
    const el = target instanceof Element ? target : null
    return el?.closest('[data-node-id], [data-edge-id]')?.getAttribute('data-node-id')
      || el?.closest('[data-node-id], [data-edge-id]')?.getAttribute('data-edge-id')
      || null
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const id = getId(e.target)
    stateRef.current = {
      ...stateRef.current,
      startId: id,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      dragging: false,
    }

    if (id) {
      stateRef.current.longPressTimer = window.setTimeout(() => {
        stateRef.current.doubleTapPending = false
        handlers.onLongPress?.(id)
      }, 600)
    }
    handlers.onDragStart?.(id)
  }, [getId, handlers])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const state = stateRef.current
    const moved = Math.hypot(e.clientX - state.startX, e.clientY - state.startY)

    if (moved > 8) {
      clearLongPress()
      state.dragging = true
    }

    const id = getId(e.target)
    handlers.onDragMove?.(id)
  }, [getId, handlers, clearLongPress])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    clearLongPress()
    const state = stateRef.current
    const id = state.startId
    const duration = Date.now() - state.startTime
    const moved = Math.hypot(e.clientX - state.startX, e.clientY - state.startY)
    handlers.onDragEnd?.(id)

    if (!id || state.dragging || moved > 16 || duration > 600) return

    const now = Date.now()
    const isDoubleTap = state.lastTapId === id && now - state.lastTapTime < 350

    if (isDoubleTap) {
      state.doubleTapPending = false
      state.lastTapTime = 0
      state.lastTapId = null
      handlers.onDoubleTap?.(id)
      return
    }

    state.lastTapTime = now
    state.lastTapId = id
    state.doubleTapPending = true

    window.setTimeout(() => {
      if (state.doubleTapPending && state.lastTapId === id) {
        state.doubleTapPending = false
        handlers.onTap?.(id)
      }
    }, 350)
  }, [handlers, clearLongPress])

  return { onPointerDown, onPointerMove, onPointerUp }
}
