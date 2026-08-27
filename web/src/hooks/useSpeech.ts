import { useCallback, useEffect, useRef, useState } from 'react'

export interface SpeechSettings {
  enabled: boolean
  rate: number
  pitch: number
}

export function useSpeech(settings: SpeechSettings) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [unlocked, setUnlocked] = useState(false)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => {
    const synth = synthRef.current
    if (!synth) return

    const loadVoices = () => setVoices(synth.getVoices())
    loadVoices()
    synth.onvoiceschanged = loadVoices
    return () => {
      synth.onvoiceschanged = null
    }
  }, [])

  const unlock = useCallback(() => {
    const synth = synthRef.current
    if (!synth || unlocked) return
    const utter = new SpeechSynthesisUtterance('Audio enabled')
    utter.volume = 0
    synth.speak(utter)
    setUnlocked(true)
  }, [unlocked])

  const speak = useCallback(
    (text: string, options: { interrupt?: boolean } = {}) => {
      const synth = synthRef.current
      if (!synth || !settings.enabled || !text) return
      if (options.interrupt) synth.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = settings.rate
      utter.pitch = settings.pitch
      if (voices.length) {
        const preferred = voices.find((v) => v.default) || voices[0]
        utter.voice = preferred
      }
      synth.speak(utter)
    },
    [settings.enabled, settings.rate, settings.pitch, voices]
  )

  const cancel = useCallback(() => {
    synthRef.current?.cancel()
  }, [])

  return { speak, cancel, unlock, unlocked, voices }
}
