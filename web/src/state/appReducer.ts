import type { ExtractionResult, Focus } from '../types/graph'

export interface AppState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  extraction: ExtractionResult | null
  focus: Focus
  askOpen: boolean
  provider: string
  hasApiKey: boolean
}

export type AppAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_EXTRACTION'; payload: ExtractionResult }
  | { type: 'SET_FOCUS'; payload: Focus }
  | { type: 'OPEN_ASK' }
  | { type: 'CLOSE_ASK' }
  | { type: 'SET_HEALTH'; payload: { provider: string; hasApiKey: boolean } }
  | { type: 'CLEAR_ERROR' }

export const initialState: AppState = {
  status: 'idle',
  error: null,
  extraction: null,
  focus: { type: 'diagram' },
  askOpen: false,
  provider: 'mock',
  hasApiKey: false,
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, status: 'loading', error: null }
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload }
    case 'SET_EXTRACTION':
      return {
        ...state,
        status: 'ready',
        extraction: action.payload,
        focus: { type: 'diagram' },
        error: null,
      }
    case 'SET_FOCUS':
      return { ...state, focus: action.payload }
    case 'OPEN_ASK':
      return { ...state, askOpen: true }
    case 'CLOSE_ASK':
      return { ...state, askOpen: false }
    case 'SET_HEALTH':
      return { ...state, provider: action.payload.provider, hasApiKey: action.payload.hasApiKey }
    case 'CLEAR_ERROR':
      return { ...state, error: null, status: state.extraction ? 'ready' : 'idle' }
    default:
      return state
  }
}
