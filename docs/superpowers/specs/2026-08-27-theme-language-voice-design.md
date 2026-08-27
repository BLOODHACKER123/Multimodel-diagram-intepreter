# Theme, Speech Language, and Voice Selection

## Overview

Add three user-facing accessibility/comfort settings to the Multimodal Diagram Interpreter:

1. **Light / dark mode toggle** — default dark, manual toggle, persisted in `localStorage`.
2. **Speech language selection** — filter the browser's available speech-synthesis voices by language.
3. **Voice selection** — choose a specific voice from the voices available for the selected language.

## Goals

- Let low-vision users control visual contrast and spoken output.
- Reuse the existing `SettingsContext` so persistence and UI wiring stay simple.
- Keep the implementation dependency-free.

## Non-goals

- Full UI translation (i18n) is out of scope; only speech language is configurable.
- No system-preference theme listener in this iteration; default is dark.

## Architecture

Extend the existing settings layer:

- `web/src/state/SettingsContext.tsx`
  - Add `theme: 'light' | 'dark'` (default `'dark'`).
  - Add `speechLanguage: string` (default `'en-US'`, falling back to the first available voice language when `en-US` is absent).
  - Add `speechVoiceUri: string` (default to the first available voice's `voiceURI`).
  - On load, merge saved settings with defaults and validate.
  - On theme change, apply `data-theme` attribute to `<html>`.
- `web/src/styles/global.css`
  - Keep existing `:root` dark variables.
  - Add `[data-theme="light"]` override block with light equivalents.
- `web/src/hooks/useSpeech.ts`
  - Accept the new settings.
  - Set `utterance.voice` to the selected voice if found.
  - Set `utterance.lang` to the selected language.
  - Fall back to the first voice for the selected language, then the browser default.
- `web/src/components/SettingsBar.tsx`
  - Add theme toggle button.
  - Add language `<select>` populated from unique voice languages.
  - Add voice `<select>` populated from voices matching the selected language.
- `web/src/hooks/useVoices.ts` (new)
  - Wrap `speechSynthesis.getVoices()` and `onvoiceschanged`.
  - Return grouped/derived voice lists.

## Data Flow

```
User changes setting
        │
        ▼
SettingsBar calls setSettings
        │
        ▼
SettingsContext updates state
        │
        ├──► localStorage.setItem('mdi-settings', ...)
        │
        ├──► useEffect sets document.documentElement.dataset.theme
        │
        └──► consumers (useSpeech, SettingsBar) re-render
                    │
                    ▼
        useSpeech uses selected voice/lang for utterances
```

## Components

### SettingsBar

- **Theme toggle** — button with `aria-pressed`, toggles between `'light'` and `'dark'`.
- **Language select** — `<select>` with one `<option>` per unique `voice.lang`. Disabled if no voices loaded.
- **Voice select** — `<select>` with one `<option>` per voice matching the selected language. Disabled if no matching voices.

### useVoices hook

- Loads voices on mount and on `window.speechSynthesis.onvoiceschanged`.
- Returns:
  - `voices: SpeechSynthesisVoice[]`
  - `languages: string[]` — unique BCP-47 language tags, sorted.
  - `voicesForLanguage(lang): SpeechSynthesisVoice[]`

### useSpeech hook

- Looks up voice by `speechVoiceUri`; if missing, falls back to first voice for `speechLanguage`, then first available voice.
- Sets `utterance.lang` to `speechLanguage`.

## Error Handling

- If `speechSynthesis` returns no voices, language and voice selects show a "No voices available" placeholder.
- If a saved `speechVoiceUri` is no longer available, fall back gracefully.
- If a saved `theme` value is invalid, fall back to `'dark'`.
- Invalid saved settings are ignored during merge (existing behavior).

## Testing

- `npm run typecheck` must pass.
- Manual verification:
  1. Toggle theme; verify CSS variables switch and reload preserves choice.
  2. Change speech language; verify voice dropdown updates.
  3. Change voice; verify `utterance.voice` uses the selected voice (can inspect via browser DevTools or listen).
  4. Reload page; verify all three settings persist.

## Files to Change

- `web/src/state/SettingsContext.tsx`
- `web/src/styles/global.css`
- `web/src/hooks/useSpeech.ts`
- `web/src/hooks/useVoices.ts` (new)
- `web/src/components/SettingsBar.tsx`

## Open Questions

None.
