import { useState } from 'react'
import { ArrowRight, X, Plus, Loader2 } from 'lucide-react'

export default function PlanView({ loading, error, plan, onBegin, onRetry }) {
  const [areas, setAreas] = useState(plan?.investigationAreas || [])

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <Loader2 size={22} className="animate-spin text-lens-400" />
        <p className="mt-4 font-serif text-lg text-paper-50">Drafting the research plan…</p>
        <p className="mt-1.5 text-sm text-paper-50/50">Extracting PICO elements and investigation areas.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-serif text-lg text-paper-50">Couldn't build the plan</p>
        <p className="mt-2 text-sm text-signal-coral">{error}</p>
        <button onClick={onRetry} className="focus-ring mt-6 rounded-md border border-ink-500 px-4 py-2 text-sm text-paper-50/80 hover:border-lens-500/50">
          Try again
        </button>
      </div>
    )
  }

  if (!plan) return null
  const list = areas.length ? areas : plan.investigationAreas || []

  const updateArea = (i, val) => {
    const next = [...list]
    next[i] = val
    setAreas(next)
  }
  const removeArea = (i) => setAreas(list.filter((_, idx) => idx !== i))
  const addArea = () => setAreas([...list, ''])

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-lens-400/80">Research Planning Agent</p>
      <h1 className="mt-3 font-serif text-2xl text-paper-50">Research Question</h1>
      <p className="mt-2 text-paper-50/75">{plan.question}</p>

      {plan.pico && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            ['Population', plan.pico.population],
            ['Intervention', plan.pico.intervention],
            ['Comparator', plan.pico.comparator],
            ['Outcome', plan.pico.outcome],
          ].map(([label, val]) => (
            <div key={label} className="rounded-lg border border-ink-600 bg-ink-900/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-wide text-lens-400/70">{label}</p>
              <p className="mt-1.5 text-sm text-paper-50/85">{val || 'Not specified'}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-9">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-paper-50/45">Investigation Areas</p>
        <div className="space-y-2">
          {list.map((area, i) => (
            <div key={i} className="group flex items-center gap-2 rounded-md border border-ink-600 bg-ink-900/40 px-3 py-2">
              <span className="font-mono text-xs text-paper-50/35">{String(i + 1).padStart(2, '0')}</span>
              <input
                value={area}
                onChange={(e) => updateArea(i, e.target.value)}
                className="focus-ring flex-1 bg-transparent text-sm text-paper-50/85"
              />
              <button
                onClick={() => removeArea(i)}
                className="focus-ring rounded p-1 text-paper-50/30 opacity-0 transition hover:text-signal-coral group-hover:opacity-100"
                aria-label="Remove investigation area"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addArea}
          className="focus-ring mt-3 inline-flex items-center gap-1.5 text-xs text-paper-50/50 hover:text-lens-400"
        >
          <Plus size={13} /> Add investigation area
        </button>
      </div>

      <div className="mt-10">
        <button
          onClick={() => onBegin(list.filter((a) => a.trim()))}
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-lens-500 px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-lens-400"
        >
          Begin Evidence Search <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
