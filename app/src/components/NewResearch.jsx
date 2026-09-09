import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { ResearchDisclaimer } from './Bits.jsx'

const TYPES = [
  'General Medical Research', 'Clinical Evidence', 'Literature Review', 'Systematic Review',
  'Drug Research', 'Disease Research', 'Diagnostic Research', 'Biomedical Research',
  'Epidemiology', 'Public Health', 'Medical Technology',
]

const DEPTHS = [
  { key: 'quick', label: 'Quick', body: '~6 sources, headline synthesis' },
  { key: 'standard', label: 'Standard', body: '~12 sources, PICO + comparison' },
  { key: 'deep', label: 'Deep', body: '~20 sources, conflict detection' },
  { key: 'comprehensive', label: 'Comprehensive', body: 'Full pipeline, research gaps' },
]

export default function NewResearch({ initialQuestion, onSubmit }) {
  const [question, setQuestion] = useState(initialQuestion || '')
  const [type, setType] = useState('General Medical Research')
  const [depth, setDepth] = useState('standard')

  useEffect(() => {
    if (initialQuestion) setQuestion(initialQuestion)
  }, [initialQuestion])

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-lens-400/80">New Research</p>
      <h1 className="mt-3 font-serif text-3xl text-paper-50">What are you investigating?</h1>
      <p className="mt-2 text-paper-50/60">
        Ask a medical or biomedical research question. FEMTOLENS will build a research plan,
        search the literature, and synthesize cited evidence.
      </p>

      <div className="mt-8 rounded-xl border border-ink-600 bg-ink-900/60 p-1.5">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="e.g. What is the current evidence for GLP-1 receptor agonists in reducing cardiovascular risk in patients with obesity?"
          className="focus-ring w-full resize-none rounded-lg bg-transparent px-4 py-3 text-[15px] leading-relaxed text-paper-50 placeholder:text-paper-50/35"
        />
      </div>

      <div className="mt-8">
        <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-paper-50/45">Research Type</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`focus-ring rounded-full border px-3 py-1.5 text-xs transition ${
                type === t
                  ? 'border-lens-500/50 bg-lens-500/12 text-lens-400'
                  : 'border-ink-600 text-paper-50/60 hover:border-ink-500 hover:text-paper-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-paper-50/45">Research Depth</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DEPTHS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDepth(d.key)}
              className={`focus-ring rounded-lg border p-3 text-left transition ${
                depth === d.key
                  ? 'border-lens-500/50 bg-lens-500/10'
                  : 'border-ink-600 hover:border-ink-500'
              }`}
            >
              <p className={`text-sm font-medium ${depth === d.key ? 'text-lens-400' : 'text-paper-50'}`}>{d.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-paper-50/50">{d.body}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-9 flex items-center justify-between gap-4">
        <button
          disabled={!question.trim()}
          onClick={() => onSubmit({ question: question.trim(), type, depth })}
          className="focus-ring inline-flex items-center gap-2 rounded-md bg-lens-500 px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:bg-lens-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Build Research Plan <ArrowRight size={16} />
        </button>
      </div>

      <div className="mt-10">
        <ResearchDisclaimer />
      </div>
    </div>
  )
}
