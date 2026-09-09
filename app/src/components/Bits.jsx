export function StudyBadge({ type }) {
  const map = {
    'systematic-review': { label: 'Systematic Review', color: 'bg-lens-500/15 text-lens-400 border-lens-500/30' },
    'meta-analysis': { label: 'Meta-Analysis', color: 'bg-lens-500/15 text-lens-400 border-lens-500/30' },
    rct: { label: 'RCT', color: 'bg-signal-violet/15 text-signal-violet border-signal-violet/30' },
    cohort: { label: 'Cohort Study', color: 'bg-signal-amber/15 text-signal-amber border-signal-amber/30' },
    'case-control': { label: 'Case-Control', color: 'bg-signal-amber/15 text-signal-amber border-signal-amber/30' },
    'cross-sectional': { label: 'Cross-Sectional', color: 'bg-ink-600 text-paper-100 border-ink-500' },
    observational: { label: 'Observational', color: 'bg-ink-600 text-paper-100 border-ink-500' },
    'case-report': { label: 'Case Report', color: 'bg-signal-coral/15 text-signal-coral border-signal-coral/30' },
    review: { label: 'Review', color: 'bg-ink-600 text-paper-100 border-ink-500' },
    other: { label: 'Study', color: 'bg-ink-600 text-paper-100 border-ink-500' },
  }
  const m = map[type] || map.other
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${m.color}`}>
      {m.label}
    </span>
  )
}

export function ResearchDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <p className="text-[11px] leading-relaxed text-paper-50/40">
        FEMTOLENS provides AI-assisted research synthesis. It is not a diagnostic or treatment tool and does not replace professional medical judgment.
      </p>
    )
  }
  return (
    <div className="rounded-lg border border-signal-amber/25 bg-signal-amber/[0.06] px-4 py-3">
      <p className="text-sm leading-relaxed text-paper-50/80">
        <span className="font-medium text-signal-amber">Research tool, not clinical guidance.</span>{' '}
        FEMTOLENS provides AI-assisted research synthesis and does not replace professional medical
        judgment, clinical guidelines, or expert review. It does not diagnose patients or recommend
        individualized treatment.
      </p>
    </div>
  )
}

export function EvidenceTag({ kind }) {
  const styles = {
    source: 'text-lens-400 border-lens-500/30',
    ai: 'text-signal-violet border-signal-violet/30',
    inference: 'text-signal-amber border-signal-amber/30',
    unknown: 'text-paper-50/50 border-ink-500',
  }
  const labels = {
    source: 'Source Evidence',
    ai: 'AI Summary',
    inference: 'Inference',
    unknown: 'Insufficient Evidence',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${styles[kind]}`}>
      {labels[kind]}
    </span>
  )
}
