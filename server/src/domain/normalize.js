import crypto from 'crypto'

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'item'
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function uniqueId(base, used) {
  let id = base
  let counter = 2
  while (used.has(id)) {
    id = `${base}-${counter++}`
  }
  return id
}

function expandLayout(nodes) {
  if (nodes.length < 2) return
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const rangeX = maxX - minX
  const rangeY = maxY - minY
  const targetMin = 0.08
  const targetMax = 0.92
  const targetRange = targetMax - targetMin

  if (rangeX > 0 && rangeX < 0.5) {
    nodes.forEach((n) => {
      n.x = targetMin + (n.x - minX) * (targetRange / rangeX)
    })
  }
  if (rangeY > 0 && rangeY < 0.5) {
    nodes.forEach((n) => {
      n.y = targetMin + (n.y - minY) * (targetRange / rangeY)
    })
  }
}

function nudgeOverlaps(nodes) {
  for (let iter = 0; iter < 10; iter++) {
    let moved = false
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 1
        const minDist = (a.width + b.width) / 2 + 0.03
        if (dist < minDist) {
          const nx = dx / dist
          const ny = dy / dist
          const shift = (minDist - dist) / 2
          a.x = clamp(a.x - nx * shift, 0, 1)
          a.y = clamp(a.y - ny * shift, 0, 1)
          b.x = clamp(b.x + nx * shift, 0, 1)
          b.y = clamp(b.y + ny * shift, 0, 1)
          moved = true
        }
      }
    }
    if (!moved) break
  }
}

export function normalizeGraph(raw, diagramId) {
  const warnings = []
  const usedIds = new Set()

  const nodes = (raw.nodes || []).map((n, idx) => {
    let id = slugify(n.id || n.label || `node-${idx + 1}`)
    id = uniqueId(id, usedIds)
    usedIds.add(id)

    const width = n.width ? clamp(n.width, 0, 1) : 0.08
    const height = n.height ? clamp(n.height, 0, 1) : 0.06
    const x = clamp(n.x ?? 0.5, 0, 1)
    const y = clamp(n.y ?? 0.5, 0, 1)

    return {
      id,
      label: String(n.label || `Unlabeled ${n.type || 'node'} ${idx + 1}`).slice(0, 200),
      type: VALID_NODE_TYPES.has(n.type) ? n.type : 'other',
      shape: VALID_SHAPES.has(n.shape) ? n.shape : 'rect',
      x,
      y,
      width,
      height,
      group: n.group ? String(n.group).slice(0, 100) : undefined,
      description: n.description ? String(n.description).slice(0, 500) : undefined,
      meta: n.meta && typeof n.meta === 'object' ? n.meta : undefined,
    }
  })

  expandLayout(nodes)
  nudgeOverlaps(nodes)

  const nodeIds = new Set(nodes.map((n) => n.id))
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  const edges = (raw.edges || []).map((e, idx) => {
    const source = nodeMap[e.source] ? e.source : undefined
    const target = nodeMap[e.target] ? e.target : undefined
    if (!source || !target) {
      warnings.push(`edge-${idx + 1}: unknown endpoint (${e.source} → ${e.target})`)
    }
    return {
      id: e.id ? String(e.id).slice(0, 64) : `edge-${idx + 1}`,
      source: source || 'unknown',
      target: target || 'unknown',
      label: e.label ? String(e.label).slice(0, 200) : undefined,
      directed: Boolean(e.directed ?? raw.diagramType !== 'er'),
      relationship: e.relationship || undefined,
      weight: typeof e.weight === 'number' ? e.weight : undefined,
      waypoints: Array.isArray(e.waypoints) ? e.waypoints.map((p) => ({ x: clamp(p.x, 0, 1), y: clamp(p.y, 0, 1) })) : undefined,
      style: e.style || 'solid',
    }
  }).filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))

  // Reassign any duplicate edge ids
  const usedEdgeIds = new Set()
  for (const e of edges) {
    if (usedEdgeIds.has(e.id)) {
      e.id = uniqueId(e.id, usedEdgeIds)
    }
    usedEdgeIds.add(e.id)
  }

  // Reading order: top-to-bottom, then left-to-right
  nodes.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))

  // Default diagram type inference
  const diagramType = raw.diagramType || inferDiagramType(nodes, edges)

  const title = String(raw.title || 'Untitled diagram').slice(0, 200)
  const summary = String(raw.summary || `${nodes.length} elements, ${edges.length} connections.`).slice(0, 1000)

  return {
    id: diagramId,
    title,
    diagramType,
    summary,
    nodes,
    edges,
    imageSize: {
      width: Number.isFinite(raw.imageSize?.width) ? Math.max(1, Math.round(raw.imageSize.width)) : 1200,
      height: Number.isFinite(raw.imageSize?.height) ? Math.max(1, Math.round(raw.imageSize.height)) : 800,
    },
    legend: Array.isArray(raw.legend) ? raw.legend.map((l) => String(l).slice(0, 200)) : undefined,
  }
}

const VALID_NODE_TYPES = new Set([
  'entity',
  'attribute',
  'process',
  'service',
  'database',
  'decision',
  'state',
  'group',
  'actor',
  'other',
])

const VALID_SHAPES = new Set([
  'rect',
  'rounded',
  'ellipse',
  'circle',
  'diamond',
  'cylinder',
  'cloud',
])

function inferDiagramType(nodes, edges) {
  const labels = nodes.map((n) => n.label).join(' ').toUpperCase()
  if (labels.includes('ENTITY') || labels.includes('TABLE') || labels.includes('RELATIONSHIP')) return 'er'
  if (labels.includes('SERVICE') || labels.includes('DATABASE') || labels.includes('LOAD BALANCER')) return 'cloud-architecture'
  if (edges.some((e) => typeof e.weight === 'number')) return 'graph'
  if (labels.includes('PROCESS') || labels.includes('DECISION') || labels.includes('START') || labels.includes('END')) return 'flowchart'
  return 'other'
}

export function generateDiagramId() {
  return crypto.randomUUID()
}
