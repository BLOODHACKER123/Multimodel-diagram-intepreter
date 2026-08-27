import { useRef, useCallback, useEffect } from 'react'
import type { DiagramGraph, Focus } from '../types/graph'
import { NodeShape } from './NodeShape'
import { EdgeShape } from './EdgeShape'
import { FocusRing } from './FocusRing'
import { usePointerGestures } from '../hooks/usePointerGestures'
import { useHitTest } from '../hooks/useHitTest'
import { useGraphNavigation } from '../hooks/useGraphNavigation'
import { useSpeech } from '../hooks/useSpeech'
import { useHaptics } from '../hooks/useHaptics'
import { useSettings } from '../state/SettingsContext'
import { describeNode, describeEdge, describeDiagram } from '../utils/describe'
import { VIEWBOX_WIDTH } from '../utils/geometry'

interface DiagramCanvasProps {
  graph: DiagramGraph
  imageUrl?: string
  focus: Focus
  onFocusChange: (focus: Focus) => void
  onAsk: () => void
}

export function DiagramCanvas({ graph, imageUrl, focus, onFocusChange, onAsk }: DiagramCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { settings } = useSettings()
  const { speak } = useSpeech({
    enabled: settings.speechEnabled && !settings.screenReaderMode,
    rate: settings.speechRate,
    pitch: settings.speechPitch,
  })
  const { vibrate, vibrateThrottled } = useHaptics()
  const { hasChanged } = useHitTest(graph, svgRef)
  const { handleKey } = useGraphNavigation(graph, focus, onFocusChange)

  const aspectRatio = graph.imageSize.height / graph.imageSize.width
  const viewBoxHeight = VIEWBOX_WIDTH * aspectRatio

  const describeFocus = useCallback((f: Focus) => {
    if (f.type === 'diagram') return describeDiagram(graph)
    if (f.type === 'node') {
      const node = graph.nodes.find((n) => n.id === f.id)
      return node ? describeNode(node, graph) : ''
    }
    const edge = graph.edges.find((e) => e.id === f.id)
    return edge ? describeEdge(edge, graph) : ''
  }, [graph])

  const setFocusAndSpeak = useCallback((f: Focus, { interrupt = false, haptic = true } = {}) => {
    onFocusChange(f)
    const text = describeFocus(f)
    if (text) speak(text, { interrupt })
    if (haptic && settings.hapticsEnabled) {
      vibrate(f.type === 'edge' ? 'edge' : f.type === 'node' ? 'node' : 'boundary')
    }
  }, [onFocusChange, describeFocus, speak, vibrate, settings.hapticsEnabled])

  const onDragMove = useCallback((id: string | null) => {
    if (!id) return
    const type = graph.nodes.some((n) => n.id === id) ? 'node' : 'edge'
    if (hasChanged(id)) {
      setFocusAndSpeak({ type, id }, { interrupt: true, haptic: false })
      if (settings.hapticsEnabled) vibrateThrottled(type === 'edge' ? 'edge' : 'node')
    }
  }, [graph, hasChanged, setFocusAndSpeak, settings.hapticsEnabled, vibrateThrottled])

  const onTap = useCallback((id: string) => {
    const type = graph.nodes.some((n) => n.id === id) ? 'node' : 'edge'
    setFocusAndSpeak({ type, id }, { interrupt: false })
  }, [graph, setFocusAndSpeak])

  const onDoubleTap = useCallback((id: string) => {
    const type = graph.nodes.some((n) => n.id === id) ? 'node' : 'edge'
    setFocusAndSpeak({ type, id })
    onAsk()
  }, [graph, setFocusAndSpeak, onAsk])

  const gestures = usePointerGestures({
    onTap,
    onDoubleTap,
    onDragMove,
  })

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'q' || e.key === 'Q') {
      e.preventDefault()
      onAsk()
      return
    }
    if (e.key === '?' || e.key === 'Slash') {
      e.preventDefault()
      speak('Keyboard shortcuts. Tab to navigate. Arrows for spatial neighbors. N and P for next and previous. E cycles edges. Q asks a question. Escape closes dialogs.')
      return
    }
    handleKey(e)
  }, [handleKey, onAsk, speak])

  useEffect(() => {
    // When focus changes externally, make sure it's spoken once
    const text = describeFocus(focus)
    if (text) speak(text, { interrupt: true })
  }, [focus.id, focus.type]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="canvas-container">
      <svg
        ref={svgRef}
        className="diagram-canvas"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label={`Interactive diagram: ${graph.title}`}
        aria-describedby="diagram-summary"
        tabIndex={0}
        onKeyDown={onKeyDown}
        {...gestures}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--edge-color)" />
          </marker>
        </defs>

        {imageUrl && (
          <image
            href={imageUrl}
            x={0}
            y={0}
            width={VIEWBOX_WIDTH}
            height={viewBoxHeight}
            opacity={settings.imageOpacity}
            pointerEvents="none"
          />
        )}

        <g className="edges">
          {graph.edges.map((edge) => (
            <EdgeShape
              key={edge.id}
              edge={edge}
              graph={graph}
              aspectRatio={aspectRatio}
              isFocused={focus.type === 'edge' && focus.id === edge.id}
              onFocus={() => setFocusAndSpeak({ type: 'edge', id: edge.id })}
            />
          ))}
        </g>

        <g className="nodes">
          {graph.nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              graph={graph}
              aspectRatio={aspectRatio}
              isFocused={focus.type === 'node' && focus.id === node.id}
              onFocus={() => setFocusAndSpeak({ type: 'node', id: node.id })}
            />
          ))}
        </g>

        <FocusRing graph={graph} focus={focus} aspectRatio={aspectRatio} />
      </svg>

      <div id="diagram-summary" className="sr-only">
        {graph.summary}
      </div>

      {!settings.speechEnabled && (
        <div className="audio-hint">
          <button onClick={() => { /* settings handled elsewhere */ }}>
            Enable audio feedback in settings
          </button>
        </div>
      )}
    </div>
  )
}
