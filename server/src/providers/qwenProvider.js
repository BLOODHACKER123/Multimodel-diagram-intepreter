import OpenAI from 'openai'
import { normalizeGraph, generateDiagramId } from '../domain/normalize.js'
import { serializeGraphContext } from '../domain/serialize.js'
import { EXTRACTION_SYSTEM_PROMPT, ASK_SYSTEM_PROMPT, JSON_REPAIR_PROMPT } from './prompts.js'
import { extractJson } from './jsonRepair.js'
import { diagramGraphSchema, askResponseSchema } from '../domain/schema.js'
import { getImageDimensions } from '../utils/imageDimensions.js'
import { resizeImage } from '../utils/resizeImage.js'

export function createQwenProvider(config) {
  const client = new OpenAI({
    baseURL: config.qwenBaseUrl,
    apiKey: config.dashscopeApiKey,
    timeout: config.requestTimeoutMs,
  })

  async function extractFromImage({ buffer, mimeType }) {
    const base64 = buffer.toString('base64')
    const response = await client.chat.completions.create({
      model: config.qwenVlModel,
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Return the JSON representation of this diagram.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
    })
    return response.choices[0]?.message?.content || ''
  }

  async function parseExtraction(rawText, attemptRepair = true) {
    try {
      const jsonText = extractJson(rawText)
      const parsed = JSON.parse(jsonText)
      const validated = diagramGraphSchema.parse(parsed)
      return validated
    } catch (err) {
      console.error('[qwenProvider] parseExtraction failed:', err.message)
      console.error('[qwenProvider] rawText length:', rawText.length)
      console.error('[qwenProvider] rawText snippet:', rawText.slice(0, 2000))
      if (!attemptRepair) throw err
      const repairResponse = await client.chat.completions.create({
        model: config.qwenTextModel,
        temperature: 0.0,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: JSON_REPAIR_PROMPT },
          { role: 'user', content: `Fix this JSON:\n\n${rawText}\n\nOriginal error: ${err.message}` },
        ],
      })
      const repaired = repairResponse.choices[0]?.message?.content || ''
      const jsonText = extractJson(repaired)
      const parsed = JSON.parse(jsonText)
      return diagramGraphSchema.parse(parsed)
    }
  }

  return {
    name: 'qwen',
    visionModel: config.qwenVlModel,
    textModel: config.qwenTextModel,

    async extract({ buffer, mimeType }) {
      const dims = getImageDimensions(buffer)
      const { buffer: visionBuffer, mimeType: visionMimeType } = await resizeImage(buffer)
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
        confidence: 0.8,
        warnings: [],
        provider: 'qwen',
        model: config.qwenVlModel,
      }
    },

    async ask({ question, graph, focus }) {
      const context = serializeGraphContext(graph, focus)
      const response = await client.chat.completions.create({
        model: config.qwenTextModel,
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: 'system', content: ASK_SYSTEM_PROMPT },
          { role: 'user', content: `Diagram context:\n${context}\n\nQuestion: ${question}` },
        ],
      })
      const rawText = response.choices[0]?.message?.content || '{"answer":"No response","followUps":[]}'
      const jsonText = extractJson(rawText)
      const parsed = JSON.parse(jsonText)
      return askResponseSchema.parse(parsed)
    },
  }
}
