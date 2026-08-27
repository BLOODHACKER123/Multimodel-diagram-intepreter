# Theme Switching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persisted light/dark mode toggle controlled from `SettingsBar`, applying a `data-theme` attribute to `<html>` and swapping CSS variables.

**Architecture:** Extend the `Settings` type in `SettingsContext` with a validated `theme` field, sync `document.documentElement.dataset.theme` whenever it changes, provide a light palette via `[data-theme="light"]` CSS overrides, and expose a toggle button in `SettingsBar`.

**Tech Stack:** React 18, TypeScript, Vite, CSS variables. No new test framework — verification is `tsc --noEmit` plus manual browser checks.

---

## Task 1: Add a `typecheck` npm script

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Add the script**

Update `web/package.json` scripts to:

```json
"scripts": {
  "dev": "vite --host",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 2: Verify it runs**

```bash
npm run typecheck
```

Expected: TypeScript reports no errors (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add web/package.json
git commit -m "chore: add typecheck npm script"
```

---

## Task 2: Extend `SettingsContext` with theme and DOM sync

**Files:**
- Modify: `web/src/state/SettingsContext.tsx`

- [ ] **Step 1: Update the context implementation**

Replace the contents of `web/src/state/SettingsContext.tsx` with:

```tsx
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
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/state/SettingsContext.tsx
git commit -m "feat(settings): add persisted theme with DOM sync and validation"
```

---

## Task 3: Add light theme CSS palette

**Files:**
- Modify: `web/src/styles/global.css`

- [ ] **Step 1: Add `[data-theme="light"]` overrides**

Insert the following block immediately after the `:root` block in `web/src/styles/global.css`:

```css
[data-theme="light"] {
  --bg: #ffffff;
  --surface: #f1f3f4;
  --surface-2: #e8eaed;
  --text: #202124;
  --text-muted: #5f6368;
  --accent: #1967d2;
  --accent-2: #9334e6;
  --focus-color: #f9ab00;
  --node-color: #1967d2;
  --node-fill: rgba(25, 103, 210, 0.12);
  --edge-color: #5f6368;
  --error: #d93025;
  --success: #188038;
  --border: #dadce0;
  --input-bg: #ffffff;
  --warning-text: #7a4e00;
  color-scheme: light;
}
```

- [ ] **Step 2: Make the warning banner theme-aware**

Add `--warning-text: #f9d76c;` inside the `:root` block (after `--input-bg`).

Then replace the `.warnings` rule with:

```css
.warnings {
  background: rgba(251, 188, 4, 0.12);
  border: 1px solid var(--focus-color);
  color: var(--warning-text);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/styles/global.css
git commit -m "feat(theme): add light palette and theme-aware warning banner"
```

---

## Task 4: Add theme toggle to `SettingsBar`

**Files:**
- Modify: `web/src/components/SettingsBar.tsx`

- [ ] **Step 1: Add the toggle button**

Add the following button inside the `.settings-bar` div in `web/src/components/SettingsBar.tsx`, after the High contrast label and before the closing `</div>`:

```tsx
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
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/SettingsBar.tsx
git commit -m "feat(settings-bar): add theme toggle button"
```

---

## Task 5: Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Typecheck the whole frontend**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 2: Manual browser verification**

1. Start the dev server: `npm run dev`
2. Open the app in a browser.
3. Click the **Dark/Light** button in the settings bar.
4. Confirm the page background, panels, and text switch to the light palette.
5. Reload the page and confirm the chosen theme persists.
6. Switch back to dark and confirm the page returns to the dark palette.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(theme): light/dark mode toggle with persistence" || echo "No new changes to commit"
```

---

## Spec coverage check

| Spec requirement | Covered by |
|---|---|
| Add `theme: 'light' \| 'dark'` default `'dark'` | Task 2 |
| Validate/persist saved settings | Task 2 `loadSettings` + localStorage effect |
| Apply `data-theme` to `<html>` | Task 2 DOM sync effect |
| Light palette in `global.css` | Task 3 CSS overrides |
| Theme toggle button in `SettingsBar` | Task 4 |
| `npm run typecheck` must pass | Task 5 Step 1 |
| Manual verification steps | Task 5 Step 2 |

Speech language and voice selection are intentionally out of this plan; they will get their own implementation plan next.
