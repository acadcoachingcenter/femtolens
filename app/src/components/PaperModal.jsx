import { X, ExternalLink } from 'lucide-react'
import { StudyBadge } from './Bits.jsx'
import { vancouver } from '../lib/citations.js'

export default function PaperModal({ paper, onClose }) {
  if (!paper) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/80 px-4 py-10 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl border border-ink-600 bg-ink-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <StudyBadge type={paper.studyType} />
          <button onClick={onClose} className="focus-ring rounded p-1 text-paper-50/50 hover:text-paper-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <h2 className="mt-3 font-serif text-xl leading-snug text-paper-50">{paper.title}</h2>
        <p className="mt-1.5 text-sm text-paper-50/55">{paper.authors}</p>
        <p className="text-sm italic text-paper-50/45">{paper.journal} · {paper.year}</p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-paper-50/40">
          {paper.pmid && <span>PMID {paper.pmid}</span>}
          {paper.doi && <span>DOI {paper.doi}</span>}
        </div>

        {paper.abstract && (
          <div className="mt-5">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-paper-50/45">Abstract</p>
            <p className="max-h-64 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-paper-50/75">
              {paper.abstract}
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-paper-50/45">Citation (Vancouver)</p>
          <p className="rounded-md border border-ink-700 bg-ink-950/60 p-3 font-mono text-[11px] leading-relaxed text-paper-50/65">
            {vancouver(paper)}
          </p>
        </div>

        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-5 inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3.5 py-2 text-sm text-paper-50/80 hover:border-lens-500/50 hover:text-paper-50"
          >
            <ExternalLink size={14} /> Open on PubMed
          </a>
        )}
      </div>
    </div>
  )
}
