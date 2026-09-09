import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const CX = 100
const CY = 110
const R = 90

function pointAt(pct) {
  const theta = (180 * (1 - pct / 100) * Math.PI) / 180
  return { x: CX + R * Math.cos(theta), y: CY - R * Math.sin(theta) }
}

const P120 = pointAt(200 / 3) // theta=120 boundary
const P60 = pointAt(100 / 3) // theta=60 boundary

export default function UsageGauge({ refreshKey = 0, compact = false }) {
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.usage()
      .then((data) => !cancelled && setUsage(data))
      .catch(() => !cancelled && setError(true))
    return () => { cancelled = true }
  }, [refreshKey])

  if (error) return null
  if (!usage || !usage.available) {
    return (
      <div className="rounded-md border border-ink-700 bg-ink-900/40 p-3">
        <p className="font-mono text-[10px] uppercase tracking-wide text-paper-50/40">Groq headroom</p>
        <p className="mt-1 text-[11px] text-paper-50/35">No usage recorded yet — run a research question first.</p>
      </div>
    )
  }

  const reqPct = usage.requests?.limit ? Math.max(0, Math.min(100, (usage.requests.remaining / usage.requests.limit) * 100)) : 100
  const tokPct = usage.tokens?.limit ? Math.max(0, Math.min(100, (usage.tokens.remaining / usage.tokens.limit) * 100)) : 100
  const pct = Math.min(reqPct, tokPct)
  const needle = pointAt(pct)
  const zoneColor = pct < 33 ? 'text-signal-coral' : pct < 66 ? 'text-signal-amber' : 'text-lens-400'

  return (
    <div className="rounded-md border border-ink-700 bg-ink-900/40 p-3">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-paper-50/40">Groq free-tier headroom</p>
      <svg viewBox="0 0 200 125" className={compact ? 'mx-auto h-16 w-auto' : 'mx-auto h-24 w-auto'}>
        <path d={`M10,110 A${R},${R} 0 0,1 ${P120.x.toFixed(1)},${P120.y.toFixed(1)}`} stroke="#E1684F" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.85" />
        <path d={`M${P120.x.toFixed(1)},${P120.y.toFixed(1)} A${R},${R} 0 0,1 ${P60.x.toFixed(1)},${P60.y.toFixed(1)}`} stroke="#E3A345" strokeWidth="12" fill="none" opacity="0.85" />
        <path d={`M${P60.x.toFixed(1)},${P60.y.toFixed(1)} A${R},${R} 0 0,1 190,110`} stroke="#5FD9CF" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.85" />
        <line x1={CX} y1={CY} x2={needle.x.toFixed(1)} y2={needle.y.toFixed(1)} stroke="#F6F5F0" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="5" fill="#F6F5F0" />
      </svg>
      <p className={`text-center font-mono text-lg font-medium ${zoneColor}`}>{Math.round(pct)}%</p>
      {!compact && (
        <dl className="mt-1 space-y-0.5 text-center text-[10px] text-paper-50/40">
          <div>{usage.requests.remaining}/{usage.requests.limit} requests · {usage.tokens.remaining}/{usage.tokens.limit} tokens (window)</div>
        </dl>
      )}
    </div>
  )
}
