import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

function env(key, defaultValue) {
  const value = process.env[key]
  if (value === undefined || value === '') return defaultValue
  return value
}

function envInt(key, defaultValue) {
  const value = parseInt(env(key, String(defaultValue)), 10)
  return Number.isNaN(value) ? defaultValue : value
}

function envBool(key, defaultValue) {
  const value = env(key, String(defaultValue)).toLowerCase()
  return value === 'true' || value === '1'
}

export const config = Object.freeze({
  port: envInt('PORT', 3001),
  nodeEnv: env('NODE_ENV', 'development'),
  corsOrigin: env('CORS_ORIGIN', 'http://localhost:5173'),
  llmProvider: env('LLM_PROVIDER', 'auto'),
  dashscopeApiKey: (env('DASHSCOPE_API_KEY', '') || env('QWEN_API_KEY', '')).trim(),
  qwenBaseUrl: env('QWEN_BASE_URL', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'),
  qwenVlModel: env('QWEN_VL_MODEL', 'qwen-vl-max'),
  qwenTextModel: env('QWEN_TEXT_MODEL', 'qwen-plus'),
  ollamaBaseUrl: env('OLLAMA_BASE_URL', 'http://localhost:11434'),
  ollamaVlModel: env('OLLAMA_VL_MODEL', 'llava'),
  ollamaTextModel: env('OLLAMA_TEXT_MODEL', 'llama3.1'),
  maxUploadMb: envInt('MAX_UPLOAD_MB', 10),
  mockLatencyMs: envInt('MOCK_LATENCY_MS', 600),
  fallbackToMock: envBool('FALLBACK_TO_MOCK', true),
  requestTimeoutMs: envInt('REQUEST_TIMEOUT_MS', 60000),
})

export function isDevelopment() {
  return config.nodeEnv === 'development'
}
