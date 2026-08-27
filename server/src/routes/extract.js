import { Router } from 'express'
import { uploadSingleImage } from '../middleware/upload.js'
import { getProvider } from '../providers/index.js'
import { config } from '../config.js'
import { extractionResultSchema } from '../domain/schema.js'
import * as store from '../domain/store.js'

const router = Router()

router.post('/', uploadSingleImage, async (req, res, next) => {
  const start = Date.now()
  try {
    if (!req.file && !req.body.mockId) {
      throw new Error('NO_FILE: image file or mockId is required')
    }

    const provider = getProvider(config)
    let result
    try {
      result = await provider.extract({
        buffer: req.file?.buffer,
        mimeType: req.file?.mimetype,
        filename: req.file?.originalname,
        mockId: req.body.mockId,
      })
    } catch (err) {
      if (config.fallbackToMock && provider.name !== 'mock') {
        console.warn('Provider failed, falling back to mock:', err.message)
        const { createMockProvider } = await import('../providers/mockProvider.js')
        const mock = createMockProvider(config)
        result = await mock.extract({
          buffer: req.file?.buffer,
          mockId: req.body.mockId,
        })
        result.warnings.push('provider_fallback')
      } else {
        throw err
      }
    }

    store.set(result.diagramId, {
      graph: result.graph,
      imageBase64: req.file?.buffer?.toString('base64'),
      mimeType: req.file?.mimetype,
    })

    const validated = extractionResultSchema.parse(result)
    res.json({
      ok: true,
      data: validated,
      meta: {
        provider: validated.provider,
        model: validated.model,
        latencyMs: Date.now() - start,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
