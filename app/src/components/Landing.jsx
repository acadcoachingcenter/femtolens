import { useState } from 'react'
import LensMark, { Wordmark } from './LensMark.jsx'
import {
  FlaskConical, Stethoscope, GraduationCap, Dna, Pill,
  Search, GitCompare, ShieldCheck, Quote, Microscope, ArrowRight,
} from 'lucide-react'

const PIPELINE = ['Question', 'Papers', 'Evidence', 'Comparison', 'Insight']

function PipelineDiagram() {
  return (
    <div className="relative rounded-2xl border border-ink-600 bg-ink-900/60 p-6 sm:p-8">
      <div className="grid-fine absolute inset-0 rounded-2xl opacity-60" />
      <div className="relative flex flex-col gap-0">
        {PIPELINE.map((step, i) => (
          <div key={step} className="flex items-center gap-4">
            <div className="flex w-full items-center gap-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lens-500/40 bg-ink-800 font-mono text-xs text-lens-400">
                {i + 1}
              </div>
              <div className="flex-1 rounded-lg border border-ink-600 bg-ink-800/80 px-4 py-2.5 text-sm text-paper-50/90">
                {step}
              </div>
            </div>
          </div>
        ))}
        <svg className="pointer-events-none absolute left-[17px] top-4 h-[calc(100%-2.25rem)] w-px" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="0" y2="100%" stroke="#5FD9CF" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.5" />
        </svg>
      </div>
    </div>
  )
}

const AUDIENCES = [
  { icon: FlaskConical, title: 'Researchers', body: 'Literature reviews, evidence synthesis, and research gap discovery.' },
  { icon: Stethoscope, title: 'Doctors & Clinicians', body: 'Explore clinical evidence and guideline literature — not diagnosis.' },
  { icon: GraduationCap, title: 'Medical Students', body: 'Understand papers, compare studies, and generate study notes.' },
  { icon: Dna, title: 'Biomedical Researchers', body: 'Molecular biology, genetics, immunology, and pharmacology.' },
  { icon: Pill, title: 'Pharma & Biotech Teams', body: 'Target discovery, trial landscapes, and mechanism research.' },
]

const CAPABILITIES = [
  { icon: Search, title: 'Literature discovery', body: 'Search across PubMed, trial registries, and biomedical databases from one question.' },
  { icon: GitCompare, title: 'Study comparison', body: 'Line studies up side by side and see exactly where — and why — they disagree.' },
  { icon: ShieldCheck, title: 'Evidence grounding', body: 'Every claim traces back to a study, a source, and a citation. Nothing is invented.' },
]

export default function Landing({ onStart }) {
  const [demoQ] = useState(
    'What is the current evidence on the effectiveness and safety of GLP-1 receptor agonists for obesity, and what major research gaps remain?'
  )

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lens-400">
            <LensMark size={24} />
            <Wordmark className="text-lg text-paper-50" />
          </div>
          <nav className="hidden items-center gap-8 text-sm text-paper-50/70 md:flex">
            <a href="#capabilities" className="hover:text-paper-50">Capabilities</a>
            <a href="#audiences" className="hover:text-paper-50">Who it's for</a>
            <a href="#pipeline" className="hover:text-paper-50">How it works</a>
          </nav>
          <button
            onClick={onStart}
            className="focus-ring rounded-md bg-lens-500 px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-lens-400"
          >
            Start Research
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-700/60">
        <div className="grid-fine absolute inset-0 opacity-40" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-lens-400/80">
              Medical &amp; biomedical research intelligence
            </p>
            <h1 className="font-serif text-4xl leading-[1.1] text-paper-50 sm:text-5xl">
              See deeper into medical evidence.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-paper-50/70">
              FEMTOLENS uses AI to discover, analyze, compare, and synthesize medical and
              biomedical research from across the scientific literature.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onStart}
                className="focus-ring inline-flex items-center gap-2 rounded-md bg-lens-500 px-5 py-3 text-sm font-medium text-ink-950 transition hover:bg-lens-400"
              >
                Start Research <ArrowRight size={16} />
              </button>
              <button
                onClick={() => onStart(demoQ)}
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-ink-500 px-5 py-3 text-sm font-medium text-paper-50/80 transition hover:border-lens-500/50 hover:text-paper-50"
              >
                Explore a Research Example
              </button>
            </div>
            <p className="mt-6 text-xs text-paper-50/40">
              Grounded in real PubMed literature. Not a diagnostic or treatment tool.
            </p>
          </div>
          <div id="pipeline">
            <PipelineDiagram />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-serif text-2xl text-paper-50 sm:text-3xl">
          Discover faster. Examine deeper. Verify evidence.
        </h2>
        <p className="mt-3 max-w-xl text-paper-50/60">
          A research laboratory in a browser — not another chatbot bolted onto a search box.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-ink-700 bg-ink-900/50 p-6">
              <Icon size={20} className="text-lens-400" />
              <h3 className="mt-4 text-base font-medium text-paper-50">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-50/60">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section id="audiences" className="border-y border-ink-700/60 bg-ink-900/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-serif text-2xl text-paper-50 sm:text-3xl">Built for the people who read the literature</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {AUDIENCES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-ink-700 p-5">
                <Icon size={18} className="text-lens-400" />
                <h3 className="mt-3 text-sm font-medium text-paper-50">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-paper-50/55">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote / positioning */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Quote size={22} className="mx-auto text-lens-400/60" />
        <p className="mt-6 font-serif text-2xl leading-snug text-paper-50 sm:text-3xl">
          Not an AI chatbot for doctors — AI-powered research intelligence for
          medicine and biomedical science.
        </p>
        <div className="mt-10">
          <button
            onClick={onStart}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-lens-500 px-6 py-3 text-sm font-medium text-ink-950 transition hover:bg-lens-400"
          >
            <Microscope size={16} /> Start Research
          </button>
        </div>
      </section>

      <footer className="border-t border-ink-700/60 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-paper-50/50">
            <LensMark size={16} />
            <span className="font-serif text-sm">FEMTOLENS</span>
          </div>
          <p className="max-w-md text-xs text-paper-50/40">
            FEMTOLENS provides AI-assisted research synthesis and does not replace professional
            medical judgment, clinical guidelines, or expert review.
          </p>
        </div>
      </footer>
    </div>
  )
}
