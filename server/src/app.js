import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRouter from './routes/health.js'
import extractRouter from './routes/extract.js'
import askRouter from './routes/ask.js'
import samplesRouter from './routes/samples.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, '..', '..', 'web', 'dist')

export function createApp() {
  const app = express()
  app.locals.config = config

  app.use(morgan('dev'))
  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/health', healthRouter)
  app.use('/api/extract', extractRouter)
  app.use('/api/ask', askRouter)
  app.use('/api/samples', samplesRouter)

  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distPath, 'index.html'))
  })

  app.use(errorHandler)

  return app
}
