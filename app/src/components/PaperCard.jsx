import { ExternalLink, Bookmark, Quote } from 'lucide-react'
import { StudyBadge } from './Bits.jsx'

export default function PaperCard({ paper, onOpen, compact = false }) {
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-900/50 p-4 transition hover:border-ink-500">
      <div className="flex items-start justify-between gap-2">
        <StudyBadge type={paper.studyType} />
        {paper.year && <span className="font-mono text-[11px] text-paper-50/40">{paper.year}</span>}
      </div>
      <button onClick={() => onOpen?.(paper)} className="focus-ring mt-2.5 block text-left">
        <h3 className="text-sm font-medium leading-snug text-paper-50 hover:text-lens-400">{paper.title}</h3>
      </button>
      {!compact && (
        <p className="mt-1.5 line-clamp-2 text-xs text-paper-50/50">
          {paper.authors} — <span className="italic">{paper.journal}</span>
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-paper-50/40">
        {paper.pmid && <span>PMID {paper.pmid}</span>}
        {paper.doi && <span>DOI {paper.doi}</span>}
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-ink-700/60 pt-2.5">
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-1 text-[11px] text-paper-50/55 hover:text-lens-400"
          >
            <ExternalLink size={11} /> Open
          </a>
        )}
        <button className="focus-ring inline-flex items-center gap-1 text-[11px] text-paper-50/55 hover:text-lens-400">
          <Bookmark size={11} /> Save
        </button>
        <button className="focus-ring inline-flex items-center gap-1 text-[11px] text-paper-50/55 hover:text-lens-400">
          <Quote size={11} /> Cite
        </button>
      </div>
    </div>
  )
}
