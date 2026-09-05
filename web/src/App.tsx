import { useEffect, useReducer, useState, useCallback } from 'react'
import { appReducer, initialState } from './state/appReducer'
import { SettingsProvider } from './state/SettingsContext'
import { LiveAnnouncer } from './components/LiveAnnouncer'
import { SettingsBar } from './components/SettingsBar'
import { UploadPanel } from './components/UploadPanel'
import { DiagramCanvas } from './components/DiagramCanvas'
import { InspectorPanel } from './components/InspectorPanel'
import { TextOutlinePanel } from './components/TextOutlinePanel'
import { QuestionDialog } from './components/QuestionDialog'
import { useAnnouncer } from './hooks/useAnnouncer'
import { getHealth } from './api/client'
import type { ExtractionResult } from './types/graph'
import './styles/global.css'
import './styles/canvas.css'

function AppContent() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const { announce } = useAnnouncer()
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    getHealth()
      .then((h) => dispatch({ type: 'SET_HEALTH', payload: { provider: h.provider, hasApiKey: h.hasApiKey } }))
      .catch(() => dispatch({ type: 'SET_HEALTH', payload: { provider: 'mock', hasApiKey: false } }))
  }, [])

  const handleExtraction = useCallback((result: ExtractionResult, url?: string) => {
    dispatch({ type: 'SET_EXTRACTION', payload: result })
    setImageUrl(url)
    announce(
      `Diagram analyzed. ${result.graph.title}. ${result.graph.nodes.length} elements, ${result.graph.edges.length} connections.`,
      'assertive'
    )
  }, [announce])

  const handleLoading = useCallback(() => {
    dispatch({ type: 'SET_LOADING' })
    announce('Analyzing diagram. Please wait.', 'polite')
  }, [announce])

  const handleError = useCallback((message: string) => {
    dispatch({ type: 'SET_ERROR', payload: message })
    announce(message, 'assertive')
  }, [announce])

  const handleFocusChange = useCallback((focus: { type: 'node' | 'edge' | 'diagram'; id?: string }) => {
    dispatch({ type: 'SET_FOCUS', payload: focus })
  }, [])

  const handleAsk = useCallback(() => {
    dispatch({ type: 'OPEN_ASK' })
  }, [])

  const handleCloseAsk = useCallback(() => {
    dispatch({ type: 'CLOSE_ASK' })
  }, [])

  return (
    <div className="app">
        <header>
          <span className="eyebrow">Accessible • Audio-Haptic</span>
          <h1>DiaSight</h1>
          <p>Diagrams, described for a brighter tomorrow.</p>
        </header>

      <main>
        <SettingsBar />

        <UploadPanel
          onExtraction={handleExtraction}
          onLoading={handleLoading}
          onError={handleError}
        />

        {state.status === 'loading' && <div className="loading">Analyzing diagram…</div>}
        {state.error && (
          <div className="error" role="alert">
            {state.error}
            <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })}>Dismiss</button>
          </div>
        )}
        {state.extraction?.warnings.length ? (
          <div className="warnings" role="status">
            {state.extraction.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        ) : null}

        {state.extraction && (
          <div className="workspace">
            <div className="canvas-column">
              <DiagramCanvas
                graph={state.extraction.graph}
                imageUrl={imageUrl}
                focus={state.focus}
                onFocusChange={handleFocusChange}
                onAsk={handleAsk}
              />
            </div>
            <div className="side-column">
              <InspectorPanel
                graph={state.extraction.graph}
                focus={state.focus}
                onFocusChange={handleFocusChange}
                onAsk={handleAsk}
              />
              <TextOutlinePanel
                graph={state.extraction.graph}
                focus={state.focus}
                onFocusChange={handleFocusChange}
              />
            </div>
          </div>
        )}
      </main>

      {state.askOpen && state.extraction && (
        <QuestionDialog
          graph={state.extraction.graph}
          diagramId={state.extraction.diagramId}
          focus={state.focus}
          onClose={handleCloseAsk}
        />
      )}

      <LiveAnnouncer />
    </div>
  )
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  )
}

export default App
