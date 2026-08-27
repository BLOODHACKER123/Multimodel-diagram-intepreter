import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { normalizeGraph, generateDiagramId } from '../domain/normalize.js'
import { serializeGraphContext } from '../domain/serialize.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FIXTURES = [
  'er-university.json',
  'cloud-web-app.json',
  'graph-shortest-path.json',
]

async function loadFixtures() {
  const fixtures = {}
  for (const name of FIXTURES) {
    const raw = await readFile(join(__dirname, '..', 'mocks', name), 'utf8')
    fixtures[name.replace('.json', '')] = JSON.parse(raw)
  }
  return fixtures
}

function hashBuffer(buffer) {
  let h = 0
  for (let i = 0; i < Math.min(buffer.length, 200); i++) {
    h = (h * 31 + buffer[i]) & 0x7fffffff
  }
  return h
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildAdjacency(graph) {
  const map = new Map(graph.nodes.map((n) => [n.id, { out: [], in: [], degree: 0 }]))
  for (const edge of graph.edges) {
    if (!map.has(edge.source) || !map.has(edge.target)) continue
    map.get(edge.source).out.push(edge)
    map.get(edge.target).in.push(edge)
    map.get(edge.source).degree++
    map.get(edge.target).degree++
  }
  return map
}

function bfsPath(graph, fromId, toId) {
  const adj = new Map(graph.nodes.map((n) => [n.id, []]))
  for (const e of graph.edges) {
    if (adj.has(e.source)) adj.get(e.source).push({ id: e.target, weight: e.weight ?? 1, edge: e })
    if (!e.directed && adj.has(e.target)) adj.get(e.target).push({ id: e.source, weight: e.weight ?? 1, edge: e })
  }
  const queue = [{ id: fromId, path: [fromId], cost: 0 }]
  const visited = new Set()
  while (queue.length) {
    const { id, path, cost } = queue.shift()
    if (id === toId) return { path, cost }
    if (visited.has(id)) continue
    visited.add(id)
    for (const next of adj.get(id) || []) {
      queue.push({ id: next.id, path: [...path, next.id], cost: cost + next.weight })
    }
  }
  return null
}

let fixturesPromise = null

export function createMockProvider(config) {
  const latency = config.mockLatencyMs

  return {
    name: 'mock',
    visionModel: 'fixture',
    textModel: 'rule-based',

    async extract({ buffer, mockId }) {
      if (!fixturesPromise) fixturesPromise = loadFixtures()
      const fixtures = await fixturesPromise
      const keys = Object.keys(fixtures)

      let key
      if (mockId && fixtures[mockId]) {
        key = mockId
      } else if (buffer) {
        key = keys[hashBuffer(buffer) % keys.length]
      } else {
        key = keys[0]
      }

      await sleep(latency)
      const fixture = fixtures[key]
      const diagramId = generateDiagramId()
      const graph = normalizeGraph(fixture, diagramId)
      const warnings = []
      if (buffer && !mockId) {
        warnings.push('mock_extraction: uploaded image was not analyzed; a sample fixture was returned instead. Add a DashScope API key to analyze real diagrams.')
      }
      return {
        diagramId,
        graph,
        confidence: 0.95,
        warnings,
        provider: 'mock',
        model: 'fixture',
      }
    },

    async ask({ question, graph, focus }) {
      await sleep(latency)
      const q = question.toLowerCase()
      const nodeMap = Object.fromEntries(graph.nodes.map((n) => [n.id, n]))
      const adj = buildAdjacency(graph)

      const focusNode = focus?.type === 'node' && focus.id ? nodeMap[focus.id] : null
      const focusEdge = focus?.type === 'edge' && focus.id ? graph.edges.find((e) => e.id === focus.id) : null

      // Counts
      if (/\bhow many\b/.test(q)) {
        if (/node|element|entity|shape/.test(q)) {
          return { answer: `The diagram has ${graph.nodes.length} nodes.`, followUps: defaultFollowUps(graph) }
        }
        if (/edge|connection|line|relationship/.test(q)) {
          return { answer: `The diagram has ${graph.edges.length} connections.`, followUps: defaultFollowUps(graph) }
        }
        return { answer: `The diagram has ${graph.nodes.length} nodes and ${graph.edges.length} connections.`, followUps: defaultFollowUps(graph) }
      }

      // Path / shortest
      const pathMatch = q.match(/(?:path|shortest|from)\s+([a-fA-F0-9]+)\s+(?:to|→)\s+([a-fA-F0-9]+)/)
      if (pathMatch) {
        const fromLabel = pathMatch[1].toUpperCase()
        const toLabel = pathMatch[2].toUpperCase()
        const fromNode = graph.nodes.find((n) => n.label.toUpperCase() === fromLabel)
        const toNode = graph.nodes.find((n) => n.label.toUpperCase() === toLabel)
        if (fromNode && toNode) {
          const result = bfsPath(graph, fromNode.id, toNode.id)
          if (result) {
            const names = result.path.map((id) => nodeMap[id].label).join(' → ')
            return { answer: `The path from ${fromLabel} to ${toLabel} is ${names}, with total weight ${result.cost}.`, followUps: defaultFollowUps(graph) }
          }
          return { answer: `There is no path from ${fromLabel} to ${toLabel} in this diagram.`, followUps: defaultFollowUps(graph) }
        }
      }

      // Connected / related to
      if (/\b(connected|related|linked|neighbors?)\b/.test(q)) {
        const target = focusNode || findNodeByQuestion(graph, q)
        if (target) {
          const edges = adj.get(target.id)
          const labels = edges.degree === 0
            ? ['none']
            : [...edges.out, ...edges.in].map((e) => {
                const otherId = e.source === target.id ? e.target : e.source
                const other = nodeMap[otherId]
                return `${other.label}${e.label ? ` (${e.label})` : ''}`
              })
          const unique = [...new Set(labels)]
          return { answer: `${target.label} is connected to ${unique.join(', ')}.`, followUps: defaultFollowUps(graph) }
        }
      }

      // Describe specific node
      const describeMatch = q.match(/\b(what is|describe|tell me about)\s+(.+)/)
      if (describeMatch) {
        const target = findNodeByQuestion(graph, describeMatch[2]) || focusNode
        if (target) {
          const edges = adj.get(target.id)
          return { answer: `${target.label} is a ${target.type}.${edges.degree ? ` It has ${edges.degree} connection${edges.degree === 1 ? '' : 's'}.` : ''}`, followUps: defaultFollowUps(graph) }
        }
      }

      // Focus fallback
      if (focusNode) {
        const edges = adj.get(focusNode.id)
        const related = edges.degree
          ? ` It connects to ${edges.out.concat(edges.in).map((e) => nodeMap[e.source === focusNode.id ? e.target : e.source].label).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ')}.`
          : ''
        return { answer: `You asked about ${focusNode.label}, which is a ${focusNode.type}.${related}`, followUps: defaultFollowUps(graph) }
      }

      if (focusEdge) {
        const source = nodeMap[focusEdge.source]
        const target = nodeMap[focusEdge.target]
        return { answer: `That connection goes from ${source.label} to ${target.label}${focusEdge.label ? `, labeled "${focusEdge.label}"` : ''}.`, followUps: defaultFollowUps(graph) }
      }

      return { answer: `This ${graph.diagramType} diagram titled "${graph.title}" has ${graph.nodes.length} nodes and ${graph.edges.length} connections. ${graph.summary}`, followUps: defaultFollowUps(graph) }
    },
  }
}

function findNodeByQuestion(graph, text) {
  const t = text.toLowerCase().trim()
  return graph.nodes.find((n) => t.includes(n.label.toLowerCase()) || t.includes(n.id.toLowerCase()))
}

function defaultFollowUps(graph) {
  const samples = [
    'How many nodes are in the diagram?',
    `What is ${graph.nodes[0]?.label || 'the first node'} connected to?`,
    'Summarize this diagram in one sentence.',
  ]
  if (graph.diagramType === 'graph') {
    samples[2] = `What is the shortest path from ${graph.nodes[0]?.label} to ${graph.nodes[graph.nodes.length - 1]?.label}?`
  }
  return samples
}
