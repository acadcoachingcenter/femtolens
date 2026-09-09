const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${path} failed (${res.status}): ${text.slice(0, 300)}`)
  }
  return res.json()
}

export const api = {
  plan: (payload) => post('/api/plan', payload),
  search: (payload) => post('/api/search', payload),
  synthesize: (payload) => post('/api/synthesize', payload),
}
