import { useCallback, useRef, useState } from 'react'
import { listSamples, extractImage, extractMock } from '../api/client'
import type { SampleInfo } from '../api/client'
import { downscaleImage, blobToFile } from '../utils/downscaleImage'
import type { ExtractionResult } from '../types/graph'

interface UploadPanelProps {
  onExtraction: (result: ExtractionResult, imageUrl?: string) => void
  onLoading: () => void
  onError: (message: string) => void
}

export function UploadPanel({ onExtraction, onLoading, onError }: UploadPanelProps) {
  const [samples, setSamples] = useState<SampleInfo[]>([])
  const [samplesLoaded, setSamplesLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadSamples = useCallback(async () => {
    if (samplesLoaded) return
    try {
      const data = await listSamples()
      setSamples(data)
      setSamplesLoaded(true)
    } catch (err) {
      console.error('Failed to load samples', err)
    }
  }, [samplesLoaded])

  const processFile = useCallback(async (file: File) => {
    onLoading()
    try {
      const blob = await downscaleImage(file)
      const downsized = blobToFile(blob, file.name)
      const result = await extractImage(downsized)
      const imageUrl = URL.createObjectURL(downsized)
      onExtraction(result, imageUrl)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed')
    }
  }, [onExtraction, onLoading, onError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current += 1
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  const handleSample = useCallback(async (id: string) => {
    onLoading()
    try {
      const result = await extractMock(id)
      onExtraction(result)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load sample')
    }
  }, [onExtraction, onLoading, onError])

  return (
    <div className="upload-panel">
      <div
        className={`drop-zone${isDragging ? ' is-dragging' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload diagram image"
        onFocus={loadSamples}
      >
        <svg className="drop-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 16V4M12 4L7 9M12 4l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p>{isDragging ? 'Drop it here' : 'Drag & drop a diagram image here, or click to choose a file.'}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          hidden
        />
      </div>

      <div className="sample-list">
        <p>Or try a sample:</p>
        <div className="sample-buttons" onMouseEnter={loadSamples} onFocus={loadSamples}>
          {samples.length
            ? samples.map((s) => (
                <button key={s.id} onClick={() => handleSample(s.id)}>
                  {s.title} ({s.nodeCount} nodes, {s.edgeCount} edges)
                </button>
              ))
            : ['er-university', 'cloud-web-app', 'graph-shortest-path'].map((id) => (
                <button key={id} onClick={() => handleSample(id)}>
                  Load {id.replace(/-/g, ' ')}
                </button>
              ))}
        </div>
      </div>
    </div>
  )
}