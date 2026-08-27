import { Router } from 'express'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { normalizeGraph } from '../domain/normalize.js'
import * as store from '../domain/store.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FIXTURES = {
  'er-university': 'er-university.json',
  'cloud-web-app': 'cloud-web-app.json',
  'graph-shortest-path': 'graph-shortest-path.json',
}

async function loadFixture(id) {
  const filename = FIXTURES[id]
  if (!filename) return null
  const raw = await readFile(join(__dirname, '..', 'mocks', filename), 'utf8')
  const fixture = JSON.parse(raw)
  return normalizeGraph(fixture, id)
}

const router = Router()

router.get('/', async (_req, res) => {
  const samples = await Promise.all(
    Object.keys(FIXTURES).map(async (id) => {
      const graph = await loadFixture(id)
      return {
        id,
        title: graph.title,
        diagramType: graph.diagramType,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
      }
    })
  )
  res.json({ ok: true, data: samples, meta: {} })
})

router.get('/:id', async (req, res) => {
  const graph = await loadFixture(req.params.id)
  if (!graph) {
    return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Sample not found' } })
  }
  store.set(graph.id, { graph, imageBase64: undefined, mimeType: undefined })
  res.json({
    ok: true,
    data: {
      diagramId: graph.id,
      graph,
      confidence: 0.95,
      warnings: [],
      provider: 'mock',
      model: 'fixture',
    },
    meta: {},
  })
})

export default router
