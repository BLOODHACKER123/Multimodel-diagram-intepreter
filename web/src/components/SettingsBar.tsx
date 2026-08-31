import { useSettings } from '../state/SettingsContext'
import { useHaptics } from '../hooks/useHaptics'

export function SettingsBar() {
  const { settings, setSettings } = useSettings()
  const { supported: hapticsSupported } = useHaptics()

  return (
    <div className="settings-bar" role="region" aria-label="Accessibility settings">
      <label>
        Speech
        <input
          type="checkbox"
          checked={settings.speechEnabled}
          onChange={(e) => setSettings((s) => ({ ...s, speechEnabled: e.target.checked }))}
        />
      </label>

      <label>
        Explain Speed
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={settings.speechRate}
          onChange={(e) => setSettings((s) => ({ ...s, speechRate: parseFloat(e.target.value) }))}
        />
      </label>

      <label>
        Haptics
        <input
          type="checkbox"
          checked={settings.hapticsEnabled}
          disabled={!hapticsSupported}
          onChange={(e) => setSettings((s) => ({ ...s, hapticsEnabled: e.target.checked }))}
        />
      </label>

      <label>
        Screen reader mode
        <input
          type="checkbox"
          checked={settings.screenReaderMode}
          onChange={(e) => setSettings((s) => ({ ...s, screenReaderMode: e.target.checked }))}
        />
      </label>

      <label>
        Image opacity
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.imageOpacity}
          onChange={(e) => setSettings((s) => ({ ...s, imageOpacity: parseFloat(e.target.value) }))}
        />
      </label>

      <label>
        High contrast
        <input
          type="checkbox"
          checked={settings.highContrast}
          onChange={(e) => setSettings((s) => ({ ...s, highContrast: e.target.checked }))}
        />
      </label>

      <button
        type="button"
        aria-pressed={settings.theme === 'dark'}
        aria-label="Toggle dark mode"
        onClick={() =>
          setSettings((s) => ({
            ...s,
            theme: s.theme === 'dark' ? 'light' : 'dark',
          }))
        }
      >
        {settings.theme === 'dark' ? 'Dark' : 'Light'}
      </button>
    </div>
  )
}
