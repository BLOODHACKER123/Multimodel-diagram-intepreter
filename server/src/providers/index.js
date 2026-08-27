import { createMockProvider } from './mockProvider.js'
import { createQwenProvider } from './qwenProvider.js'
import { createOllamaProvider } from './ollamaProvider.js'

let provider = null

export function getProvider(config) {
  if (provider) return provider

  const explicit = config.llmProvider
  const hasKey = Boolean(config.dashscopeApiKey)

  if (explicit === 'mock' || (explicit === 'auto' && !hasKey)) {
    provider = createMockProvider(config)
  } else if (explicit === 'qwen' || (explicit === 'auto' && hasKey)) {
    provider = createQwenProvider(config)
  } else if (explicit === 'ollama') {
    provider = createOllamaProvider(config)
  } else {
    throw new Error(`Unknown LLM_PROVIDER: ${explicit}`)
  }

  return provider
}

export function resetProvider() {
  provider = null
}
