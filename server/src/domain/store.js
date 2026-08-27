const TTL_MS = 30 * 60 * 1000
const MAX_ENTRIES = 20

const store = new Map()

function prune() {
  const now = Date.now()
  for (const [id, entry] of store) {
    if (entry.expiresAt < now) {
      store.delete(id)
    }
  }
}

export function set(diagramId, data) {
  prune()
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value
    store.delete(oldest)
  }
  store.set(diagramId, { ...data, createdAt: Date.now(), expiresAt: Date.now() + TTL_MS })
}

export function get(diagramId) {
  prune()
  const entry = store.get(diagramId)
  return entry || null
}
