import { createApp } from './app.js'
import { config } from './config.js'
import { getProvider } from './providers/index.js'

const app = createApp()

const server = app.listen(config.port, () => {
  const provider = getProvider(config)
  console.log(`Diagram Interpreter API running on http://localhost:${config.port}`)
  console.log(`Provider: ${provider.name} | Vision: ${provider.visionModel} | Text: ${provider.textModel}`)
  console.log(`API key present: ${Boolean(config.dashscopeApiKey)}`)
})

function shutdown() {
  console.log('\nShutting down...')
  server.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
