import { Router } from 'express'
import { getProvider } from '../providers/index.js'
import { config } from '../config.js'
import { askRequestSchema, askResponseSchema } from '../domain/schema.js'
import * as store from '../domain/store.js'

const router = Router()

router.post('/', async (req, res, next) => {
  const start = Date.now()
  try {
    const parsed = askRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new Error(`VALIDATION_FAILED: ${parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')}`)
    }

    const { question, diagramId, graph: clientGraph, focus, history } = parsed.data

    let graph = clientGraph
    let imageBase64
    if (diagramId) {
      const cached = store.get(diagramId)
      if (cached?.graph) graph = cached.graph
      imageBase64 = cached?.imageBase64
    }

    if (!graph) {
      throw new Error('VALIDATION_FAILED: diagramId or graph is required')
    }

    const provider = getProvider(config)
    let result
    try {
      result = await provider.ask({ question, graph, focus, history, imageBase64 })
    } catch (err) {
      if (config.fallbackToMock && provider.name !== 'mock') {
        console.warn('Provider failed, falling back to mock:', err.message)
        const { createMockProvider } = await import('../providers/mockProvider.js')
        const mock = createMockProvider(config)
        result = await mock.ask({ question, graph, focus })
      } else {
        throw err
      }
    }

    const validated = askResponseSchema.parse(result)
    res.json({
      ok: true,
      data: validated,
      meta: {
        provider: provider.name,
        model: provider.textModel,
        latencyMs: Date.now() - start,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
