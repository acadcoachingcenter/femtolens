import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { api } from '../lib/api.js'

export default function PricingCards({ currentTier, reason }) {
  const [tiers, setTiers] = useState([])

  useEffect(() => {
    api.tiers().then((d) => setTiers(d.tiers)).catch(() => {})
  }, [])

  const requestUpgrade = (tier) => {
    window.location.href = `mailto:hr.skylinepixelstudio@gmail.com?subject=${encodeURIComponent(
      `FEMTOLENS ${tier.label} upgrade`
    )}&body=${encodeURIComponent(`I'd like to upgrade to the ${tier.label} plan (₹${tier.priceInr}/month).`)}`
  }

  return (
    <div>
      {reason && (
        <p className="mb-5 rounded-md border border-signal-amber/25 bg-signal-amber/[0.06] px-4 py-2.5 text-sm text-paper-50/80">
          {reason}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((tier) => {
          const isCurrent = currentTier === tier.key
          return (
            <div
              key={tier.key}
              className={`rounded-xl border p-5 ${
                isCurrent ? 'border-lens-500/50 bg-lens-500/[0.06]' : 'border-ink-600 bg-ink-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-paper-50">{tier.label}</h3>
                {isCurrent && (
                  <span className="rounded-full border border-lens-500/40 px-2 py-0.5 text-[10px] text-lens-400">Current</span>
                )}
              </div>
              <p className="mt-2 text-2xl font-medium text-paper-50">
                {tier.priceInr === 0 ? 'Free' : `₹${tier.priceInr}`}
                {tier.priceInr > 0 && <span className="text-sm font-normal text-paper-50/50">/month</span>}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-paper-50/55">{tier.blurb}</p>
              <ul className="mt-4 space-y-1.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-paper-50/70">
                    <Check size={13} className="mt-0.5 shrink-0 text-lens-400" /> {f}
                  </li>
                ))}
              </ul>
              {tier.priceInr === 0 ? (
                <p className="mt-5 text-center text-[11px] text-paper-50/35">Included on sign-up</p>
              ) : (
                <button
                  onClick={() => requestUpgrade(tier)}
                  disabled={isCurrent}
                  className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-lens-500 px-3 py-2 text-xs font-medium text-ink-950 transition hover:bg-lens-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Sparkles size={13} /> {isCurrent ? 'Current plan' : 'Request upgrade'}
                </button>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-center text-[11px] text-paper-50/35">
        Online payment isn't wired up yet — "Request upgrade" emails us directly and we'll set it up manually.
      </p>
    </div>
  )
}
