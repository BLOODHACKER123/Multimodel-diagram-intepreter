import { useCallback, useRef } from 'react'

export type HapticPattern = 'node' | 'edge' | 'error' | 'dialog' | 'boundary'

const PATTERNS: Record<HapticPattern, number[]> = {
  node: [30],
  edge: [15, 40, 15],
  error: [80, 40, 80],
  dialog: [30, 50, 30],
  boundary: [10],
}

export function useHaptics() {
  const lastPulseRef = useRef(0)

  const vibrate = useCallback((pattern: HapticPattern) => {
    const pulses = PATTERNS[pattern]
    if (!navigator.vibrate) return false
    navigator.vibrate(pulses)
    lastPulseRef.current = Date.now()
    return true
  }, [])

  const vibrateThrottled = useCallback((pattern: HapticPattern, throttleMs = 80) => {
    if (!navigator.vibrate) return false
    const now = Date.now()
    if (now - lastPulseRef.current < throttleMs) return false
    navigator.vibrate(PATTERNS[pattern])
    lastPulseRef.current = now
    return true
  }, [])

  const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator

  return { vibrate, vibrateThrottled, supported }
}
