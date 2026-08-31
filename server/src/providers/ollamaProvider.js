import { normalizeGraph, generateDiagramId } from '../domain/normalize.js'
import { serializeGraphContext } from '../domain/serialize.js'
import { EXTRACTION_SYSTEM_PROMPT, ASK_SYSTEM_PROMPT, JSON_REPAIR_PROMPT } from './prompts.js'
import { extractJson } from './jsonRepair.js'
import { diagramGraphSchema, askResponseSchema } from '../domain/schema.js'
import { getImageDimensions } from '../utils/imageDimensions.js'
import { resizeImage } from '../utils/resizeImage.js'

export function createOllamaProvider(config) {
  const baseUrl = config.ollamaBaseUrl.replace(/\/$/, '')

  async function chat(params) {
    const { model, messages, format, temperature = 0.1, maxTokens = 4096 } = params
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs)

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          format,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const text = await response.text()
        if (response.status === 404 && model !== config.ollamaVlModel) {
          console.warn(`[ollamaProvider] model ${model} not found, falling back to ${config.ollamaVlModel}`)
          return chat({ ...params, model: config.ollamaVlModel })
        }
        throw new Error(`Ollama ${response.status}: ${text}`)
      }

      const data = await response.json()
      return data.message?.content || ''
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  async function extractFromImage({ buffer, mimeType }) {
    const base64 = buffer.toString('base64')
    return chat({
      model: config.ollamaVlModel,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: 'Return the JSON representation of this diagram.',
          images: [base64],
        },
      ],
      format: 'json',
      temperature: 0.1,
      maxTokens: 4096,
    })
  }

  async function parseExtraction(rawText, attemptRepair = true) {
    try {
      const jsonText = extractJson(rawText)
      const parsed = JSON.parse(jsonText)
      const validated = diagramGraphSchema.parse(parsed)
      return validated
    } catch (err) {
      console.error('[ollamaProvider] parseExtraction failed:', err.message)
      console.error('[ollamaProvider] rawText length:', rawText.length)
      console.error('[ollamaProvider] rawText snippet:', rawText.slice(0, 2000))
      if (!attemptRepair) throw err

      const repaired = await chat({
        model: config.ollamaTextModel,
        messages: [
          { role: 'system', content: JSON_REPAIR_PROMPT },
          { role: 'user', content: `Fix this JSON:\n\n${rawText}\n\nOriginal error: ${err.message}` },
        ],
        format: 'json',
        temperature: 0.0,
        maxTokens: 4096,
      })
      const jsonText = extractJson(repaired)
      const parsed = JSON.parse(jsonText)
      return diagramGraphSchema.parse(parsed)
    }
  }

  return {
    name: 'ollama',
    visionModel: config.ollamaVlModel,
    textModel: config.ollamaTextModel,

    async extract({ buffer, mimeType }) {
      const { buffer: visionBuffer, mimeType: visionMimeType } = await resizeImage(buffer)
      // Coordinates from the model are fractions of the image it actually analyzed (the resized one).
      const dims = getImageDimensions(visionBuffer)
      const rawText = await extractFromImage({ buffer: visionBuffer, mimeType: visionMimeType || mimeType })
      const rawGraph = await parseExtraction(rawText, true)
      if (dims) {
        rawGraph.imageSize = dims
      }
      const diagramId = generateDiagramId()
      const graph = normalizeGraph(rawGraph, diagramId)
      return {
        diagramId,
        graph,
        confidence: 0.75,
        warnings: [],
        provider: 'ollama',
        model: config.ollamaVlModel,
      }
    },

    async ask({ question, graph, focus }) {
      const context = serializeGraphContext(graph, focus)
      const rawText = await chat({
        model: config.ollamaTextModel,
        messages: [
          { role: 'system', content: ASK_SYSTEM_PROMPT },
          { role: 'user', content: `Diagram context:\n${context}\n\nQuestion: ${question}` },
        ],
        format: 'json',
        temperature: 0.3,
        maxTokens: 800,
      })
      const safeText = rawText || '{"answer":"No response","followUps":[]}'
      const jsonText = extractJson(safeText)
      const parsed = JSON.parse(jsonText)
      return askResponseSchema.parse(parsed)
    },
  }
}
