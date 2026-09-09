const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => ({})) : null
  if (!res.ok) {
    const message = data?.error || `${path} failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  plan: (payload) => request('/api/plan', { method: 'POST', body: payload }),
  search: (payload, token) => request('/api/search', { method: 'POST', body: payload, token }),
  synthesize: (payload, token) => request('/api/synthesize', { method: 'POST', body: payload, token }),
  authGoogle: (idToken) => request('/api/auth/google', { method: 'POST', body: { idToken } }),
  me: (token) => request('/api/me', { token }),
  tiers: () => request('/api/tiers'),
  usage: () => request('/api/usage'),
}
