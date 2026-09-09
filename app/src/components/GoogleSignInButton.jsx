import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth.jsx'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadGoogleScript() {
  if (document.getElementById('google-identity-script')) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = 'google-identity-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function GoogleSignInButton({ onSuccess, size = 'medium', text = 'signin_with' }) {
  const ref = useRef(null)
  const { signInWithGoogleCredential } = useAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!CLIENT_ID) {
      setError('Google sign-in is not configured yet.')
      return
    }
    loadGoogleScript().then(() => {
      if (cancelled || !window.google || !ref.current) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          try {
            await signInWithGoogleCredential(response.credential)
            onSuccess?.()
          } catch (e) {
            setError(e.message || 'Sign-in failed.')
          }
        },
      })
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'filled_black',
        size,
        text,
        shape: 'pill',
      })
    }).catch(() => setError('Could not load Google sign-in.'))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return <p className="text-xs text-signal-coral">{error}</p>
  }
  return <div ref={ref} />
}
