import { Router } from 'express'
import { getProvider } from '../providers/index.js'
import { config } from '../config.js'

const router = Router()

router.get('/', (_req, res) => {
  const provider = getProvider(config)
  res.json({
    ok: true,
    data: {
      status: 'ok',
      provider: provider.name,
      visionModel: provider.visionModel,
      textModel: provider.textModel,
      hasApiKey: Boolean(config.dashscopeApiKey),
      version: '0.1.0',
    },
    meta: { requestId: crypto.randomUUID() },
  })
})

export default router
