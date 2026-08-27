import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { config } from './config.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRouter from './routes/health.js'
import extractRouter from './routes/extract.js'
import askRouter from './routes/ask.js'
import samplesRouter from './routes/samples.js'

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

  app.use(errorHandler)

  return app
}
