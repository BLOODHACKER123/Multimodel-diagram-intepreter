import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export interface Settings {
  theme: Theme
  speechEnabled: boolean
  speechRate: number
  speechPitch: number
  hapticsEnabled: boolean
  screenReaderMode: boolean
  imageOpacity: number
  highContrast: boolean
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  speechEnabled: true,
  speechRate: 1,
  speechPitch: 1,
  hapticsEnabled: true,
  screenReaderMode: false,
  imageOpacity: 0.35,
  highContrast: false,
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('mdi-settings')
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

const SettingsContext = createContext<{
  settings: Settings
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
}>({ settings: DEFAULT_SETTINGS, setSettings: () => {} })

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    localStorage.setItem('mdi-settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
