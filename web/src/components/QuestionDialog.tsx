import { useEffect, useRef, useState } from 'react'
import type { DiagramGraph, Focus } from '../types/graph'
import { askQuestion } from '../api/client'
import { useSpeech } from '../hooks/useSpeech'
import { useSettings } from '../state/SettingsContext'

interface QuestionDialogProps {
  graph: DiagramGraph
  diagramId?: string
  focus: Focus
  onClose: () => void
}

export function QuestionDialog({ graph, diagramId, focus, onClose }: QuestionDialogProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [followUps, setFollowUps] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { settings } = useSettings()
  const { speak } = useSpeech({ enabled: settings.speechEnabled && !settings.screenReaderMode, rate: settings.speechRate, pitch: settings.speechPitch })

  useEffect(() => {
    inputRef.current?.focus()
    const focusLabel = focus.type === 'node'
      ? graph.nodes.find((n) => n.id === focus.id)?.label
      : focus.type === 'edge'
      ? 'this connection'
      : 'this diagram'
    setQuestion(`What can you tell me about ${focusLabel || 'this diagram'}?`)
  }, [graph, focus])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setAnswer('')
    setFollowUps([])
    try {
      const res = await askQuestion({
        question: q,
        diagramId,
        graph,
        focus,
        history,
      })
      setAnswer(res.answer)
      setFollowUps(res.followUps)
      setHistory((h) => [...h, { role: 'user', content: q }, { role: 'assistant', content: res.answer }])
      speak(res.answer)
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : 'Failed to get answer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Ask a question"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Ask a question</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit(question)
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What connects STUDENT to COURSE?"
            aria-label="Your question"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </form>

        {answer && (
          <div className="answer" aria-live="polite">
            <p>{answer}</p>
          </div>
        )}

        {followUps.length > 0 && (
          <div className="follow-ups">
            <p>Suggested:</p>
            {followUps.map((f, i) => (
              <button key={i} onClick={() => { setQuestion(f); submit(f) }}>
                {f}
              </button>
            ))}
          </div>
        )}

        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
