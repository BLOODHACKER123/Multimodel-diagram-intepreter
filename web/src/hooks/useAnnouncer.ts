import { useCallback, useRef } from 'react'

type AnnouncementPriority = 'polite' | 'assertive'

interface AnnouncerAPI {
  announce: (text: string, priority?: AnnouncementPriority) => void
}

export function useAnnouncer(): AnnouncerAPI {
  const politeRef = useRef<HTMLDivElement | null>(null)
  const assertiveRef = useRef<HTMLDivElement | null>(null)

  // Attach after mount via a callback
  const attach = useCallback(() => {
    if (!politeRef.current) politeRef.current = document.getElementById('live-polite') as HTMLDivElement
    if (!assertiveRef.current) assertiveRef.current = document.getElementById('live-assertive') as HTMLDivElement
  }, [])

  const announce = useCallback((text: string, priority: AnnouncementPriority = 'polite') => {
    attach()
    const el = priority === 'assertive' ? assertiveRef.current : politeRef.current
    if (!el) return
    el.textContent = ''
    // Force a DOM reflow so duplicate messages are announced
    void el.offsetHeight
    el.textContent = text
  }, [attach])

  return { announce }
}
