import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, XCircle, ChevronRight, Plus } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import GoogleSignInButton from './GoogleSignInButton.jsx'

const STATUS_META = {
  running: { icon: Loader2, spin: true, color: 'text-signal-amber', label: 'In progress' },
  completed: { icon: CheckCircle2, color: 'text-lens-400', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-signal-coral', label: 'Failed' },
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ActiveResearch({ onOpenRun, onNew }) {
  const { token, user } = useAuth()
  const [runs, setRuns] = useState(null)
  const [error, setError] = useState(null)
  const [openingId, setOpeningId] = useState(null)

  useEffect(() => {
    if (!token) return
    api.listRuns(token)
      .then((d) => setRuns(d.runs))
      .catch((e) => setError(e.message))
  }, [token])

  const handleOpen = async (run) => {
    if (run.status !== 'completed') return
    setOpeningId(run.id)
    try {
      const full = await api.getRun(run.id, token)
      onOpenRun(full)
    } catch (e) {
      setError(e.message)
    } finally {
      setOpeningId(null)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="font-serif text-xl text-paper-50">Sign in to see your research</h2>
        <p className="mt-2 text-sm text-paper-50/55">Active Research tracks runs tied to your account.</p>
        <div className="mt-6 flex justify-center"><GoogleSignInButton /></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-lens-400/80">Research</p>
          <h1 className="mt-3 font-serif text-2xl text-paper-50">Active Research</h1>
          <p className="mt-2 text-sm text-paper-50/55">Runs you've started recently — in progress, completed, or failed.</p>
        </div>
        <button
          onClick={onNew}
          className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md bg-lens-500 px-3.5 py-2 text-xs font-medium text-ink-950 hover:bg-lens-400"
        >
          <Plus size={14} /> New Research
        </button>
      </div>

      {error && <p className="mt-6 text-sm text-signal-coral">{error}</p>}

      {runs === null && !error && (
        <p className="mt-8 text-sm text-paper-50/40">Loading…</p>
      )}

      {runs && runs.length === 0 && (
        <div className="mt-10 rounded-lg border border-ink-600 bg-ink-900/40 p-8 text-center">
          <p className="text-sm text-paper-50/55">No research runs yet.</p>
          <button onClick={onNew} className="focus-ring mt-4 text-sm text-lens-400 hover:underline">
            Start your first research question
          </button>
        </div>
      )}

      {runs && runs.length > 0 && (
        <div className="mt-8 space-y-2">
          {runs.map((run) => {
            const meta = STATUS_META[run.status] || STATUS_META.running
            const Icon = meta.icon
            const clickable = run.status === 'completed'
            return (
              <button
                key={run.id}
                onClick={() => handleOpen(run)}
                disabled={!clickable}
                className={`focus-ring flex w-full items-center gap-3 rounded-lg border border-ink-600 bg-ink-900/40 px-4 py-3 text-left transition ${
                  clickable ? 'hover:border-lens-500/40 hover:bg-ink-900/70 cursor-pointer' : 'cursor-default opacity-80'
                }`}
              >
                <Icon size={16} className={`shrink-0 ${meta.color} ${meta.spin ? 'animate-spin' : ''}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-paper-50">{run.question}</p>
                  <p className="mt-0.5 text-[11px] text-paper-50/40">
                    {meta.label} · {run.type || 'General Medical Research'} · {run.depth || 'standard'} · {timeAgo(run.createdAt)}
                  </p>
                </div>
                {openingId === run.id ? (
                  <Loader2 size={14} className="animate-spin text-paper-50/40" />
                ) : clickable ? (
                  <ChevronRight size={16} className="shrink-0 text-paper-50/30" />
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
