import { useEffect, useState, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle, ChevronRight, Search, Star, Plus } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import GoogleSignInButton from './GoogleSignInButton.jsx'

const STATUS_META = {
  running: { icon: Loader2, spin: true, color: 'text-signal-amber', label: 'In progress' },
  completed: { icon: CheckCircle2, color: 'text-lens-400', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-signal-coral', label: 'Failed' },
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed' },
]

const PAGE_SIZE = 15

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ResearchHistory({ onOpenRun, onNew }) {
  const { token, user } = useAuth()
  const [runs, setRuns] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [openingId, setOpeningId] = useState(null)

  const load = useCallback((offset, append) => {
    if (!token) return
    append ? setLoadingMore(true) : setLoading(true)
    api.listRuns(token, { limit: PAGE_SIZE, offset, q: search, status: statusFilter })
      .then((d) => {
        setRuns((prev) => (append ? [...prev, ...d.runs] : d.runs))
        setHasMore(d.hasMore)
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => (append ? setLoadingMore(false) : setLoading(false)))
  }, [token, search, statusFilter])

  useEffect(() => {
    const t = setTimeout(() => load(0, false), search ? 350 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search, statusFilter])

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

  const toggleSave = async (run, e) => {
    e.stopPropagation()
    const next = !run.saved
    setRuns((prev) => prev.map((r) => (r.id === run.id ? { ...r, saved: next } : r)))
    try {
      await api.saveRun(run.id, next, token)
    } catch {
      setRuns((prev) => prev.map((r) => (r.id === run.id ? { ...r, saved: !next } : r)))
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="font-serif text-xl text-paper-50">Sign in to see your research history</h2>
        <p className="mt-2 text-sm text-paper-50/55">Your full archive of past research runs lives here.</p>
        <div className="mt-6 flex justify-center"><GoogleSignInButton /></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-lens-400/80">Research</p>
          <h1 className="mt-3 font-serif text-2xl text-paper-50">Research History</h1>
          <p className="mt-2 text-sm text-paper-50/55">Your full archive — search, filter, and reopen any past run.</p>
        </div>
        <button
          onClick={onNew}
          className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md bg-lens-500 px-3.5 py-2 text-xs font-medium text-ink-950 hover:bg-lens-400"
        >
          <Plus size={14} /> New Research
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paper-50/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past questions…"
            className="focus-ring w-full rounded-md border border-ink-600 bg-ink-900/50 py-2 pl-9 pr-3 text-sm text-paper-50 placeholder:text-paper-50/35"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                statusFilter === f.key
                  ? 'border-lens-500/50 bg-lens-500/12 text-lens-400'
                  : 'border-ink-600 text-paper-50/60 hover:border-ink-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-signal-coral">{error}</p>}

      {loading && (
        <p className="mt-8 text-sm text-paper-50/40">Loading…</p>
      )}

      {!loading && runs.length === 0 && !error && (
        <div className="mt-10 rounded-lg border border-ink-600 bg-ink-900/40 p-8 text-center">
          <p className="text-sm text-paper-50/55">
            {search || statusFilter ? 'No runs match this search.' : 'No research runs yet.'}
          </p>
          {!search && !statusFilter && (
            <button onClick={onNew} className="focus-ring mt-4 text-sm text-lens-400 hover:underline">
              Start your first research question
            </button>
          )}
        </div>
      )}

      {!loading && runs.length > 0 && (
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
                    {meta.label} · {run.type || 'General Medical Research'} · {run.depth || 'standard'} · {formatDate(run.createdAt)}
                  </p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => toggleSave(run, e)}
                  onKeyDown={(e) => e.key === 'Enter' && toggleSave(run, e)}
                  className="focus-ring shrink-0 rounded p-1 text-paper-50/30 hover:text-signal-amber"
                  aria-label={run.saved ? 'Unsave' : 'Save'}
                >
                  <Star size={15} className={run.saved ? 'fill-signal-amber text-signal-amber' : ''} />
                </span>
                {openingId === run.id ? (
                  <Loader2 size={14} className="animate-spin text-paper-50/40" />
                ) : clickable ? (
                  <ChevronRight size={16} className="shrink-0 text-paper-50/30" />
                ) : null}
              </button>
            )
          })}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={() => load(runs.length, true)}
                disabled={loadingMore}
                className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-4 py-2 text-xs text-paper-50/70 hover:border-lens-500/40 disabled:opacity-50"
              >
                {loadingMore && <Loader2 size={12} className="animate-spin" />}
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
