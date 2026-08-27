import type { ExtractionResult, AskRequest, AskResponse } from '../types/graph'

interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: { code: string; message: string }
  meta?: Record<string, unknown>
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { Accept: 'application/json' },
    ...options,
  })
  const body = (await res.json()) as ApiResponse<T>
  if (!res.ok || !body.ok) {
    throw new Error(body.error?.message || `HTTP ${res.status}`)
  }
  return body.data as T
}

export async function extractImage(file: File): Promise<ExtractionResult> {
  const formData = new FormData()
  formData.append('image', file)
  return request<ExtractionResult>('/api/extract', { method: 'POST', body: formData })
}

export async function extractMock(mockId: string): Promise<ExtractionResult> {
  const formData = new FormData()
  formData.append('mockId', mockId)
  return request<ExtractionResult>('/api/extract', { method: 'POST', body: formData })
}

export async function askQuestion(payload: AskRequest): Promise<AskResponse> {
  return request<AskResponse>('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export interface HealthInfo {
  status: string
  provider: string
  visionModel: string
  textModel: string
  hasApiKey: boolean
  version: string
}

export async function getHealth(): Promise<HealthInfo> {
  return request<HealthInfo>('/api/health')
}

export interface SampleInfo {
  id: string
  title: string
  diagramType: string
  nodeCount: number
  edgeCount: number
}

export async function listSamples(): Promise<SampleInfo[]> {
  return request<SampleInfo[]>('/api/samples')
}

export async function loadSample(id: string): Promise<ExtractionResult> {
  return request<ExtractionResult>(`/api/samples/${id}`)
}
