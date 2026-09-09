function b64urlEncode(bytes) {
  let str = ''
  bytes.forEach((b) => (str += String.fromCharCode(b)))
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecodeToBytes(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(b64url.length + ((4 - (b64url.length % 4)) % 4), '=')
  const str = atob(b64)
  return Uint8Array.from(str, (c) => c.charCodeAt(0))
}

function textToBytes(s) {
  return new TextEncoder().encode(s)
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', textToBytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

// Signs a small JSON payload as `base64url(payload).base64url(signature)`.
// Deliberately not full JWT — this is an internal session token, not a
// third-party-verified credential, so we skip the header/alg dance.
export async function signSession(payload, secret) {
  const body = b64urlEncode(textToBytes(JSON.stringify(payload)))
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, textToBytes(body))
  const sigB64 = b64urlEncode(new Uint8Array(sig))
  return `${body}.${sigB64}`
}

export async function verifySession(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const key = await hmacKey(secret)
  const valid = await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), textToBytes(body))
  if (!valid) return null
  let payload
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(body)))
  } catch {
    return null
  }
  if (payload.exp && Date.now() / 1000 > payload.exp) return null
  return payload
}

export function bearerToken(request) {
  const header = request.headers.get('Authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}
