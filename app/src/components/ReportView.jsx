import { useState } from 'react'
import { Download, Copy, ChevronDown, ChevronRight, AlertTriangle, Check } from 'lucide-react'
import { StudyBadge, ResearchDisclaimer, EvidenceTag } from './Bits.jsx'
import PaperCard from './PaperCard.jsx'
import { vancouver, exportAll } from '../lib/citations.js'

function Finding({ finding, papersByPmid }) {
  const [open, setOpen] = useState(false)
  const supporting = (finding.supportingPmids || []).map((id) => papersByPmid[id]).filter(Boolean)
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-900/40">
      <button onClick={() => setOpen(!open)} className="focus-ring flex w-full items-start gap-2.5 p-4 text-left">
        {open ? <ChevronDown size={15} className="mt-0.5 shrink-0 text-lens-400" /> : <ChevronRight size={15} className="mt-0.5 shrink-0 text-paper-50/40" />}
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-paper-50/90">{finding.statement}</p>
          <div className="mt-2 flex items-center gap-2">
            <EvidenceTag kind="source" />
            <span className="text-[11px] text-paper-50/40">{supporting.length} supporting {supporting.length === 1 ? 'study' : 'studies'}</span>
          </div>
        </div>
      </button>
      {open && (
        <div className="space-y-2 border-t border-ink-700/60 p-4 pt-3">
          {supporting.map((p) => (
            <PaperCard key={p.pmid || p.title} paper={p} compact />
          ))}
          {supporting.length === 0 && (
            <p className="text-xs text-paper-50/40">No linked source — treat as AI interpretation, not a direct finding.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ReportView({ question, type, papers, synthesis, onOpenPaper }) {
  const [copied, setCopied] = useState(false)
  const papersByPmid = Object.fromEntries(papers.filter((p) => p.pmid).map((p) => [p.pmid, p]))

  const reportText = buildPlainTextReport({ question, type, papers, synthesis })

  const copyReport = async () => {
    await navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const download = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-lens-400/80">Research Report</p>
      <h1 className="mt-3 font-serif text-3xl leading-tight text-paper-50">{synthesis.title || question}</h1>
      <p className="mt-3 text-sm text-paper-50/55">{type} · {papers.length} sources · Generated {new Date().toLocaleDateString()}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={copyReport} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs text-paper-50/75 hover:border-lens-500/50">
          {copied ? <Check size={13} className="text-lens-400" /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy report'}
        </button>
        <button onClick={() => download(reportText, 'femtolens-report.txt')} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs text-paper-50/75 hover:border-lens-500/50">
          <Download size={13} /> Export report (.txt)
        </button>
        <button onClick={() => download(exportAll(papers, 'bibtex'), 'femtolens-citations.bib')} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs text-paper-50/75 hover:border-lens-500/50">
          <Download size={13} /> BibTeX
        </button>
        <button onClick={() => download(exportAll(papers, 'ris'), 'femtolens-citations.ris')} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs text-paper-50/75 hover:border-lens-500/50">
          <Download size={13} /> RIS
        </button>
      </div>

      <div className="mt-8"><ResearchDisclaimer /></div>

      {synthesis.background && (
        <Section title="Background">
          <p className="text-sm leading-relaxed text-paper-50/75">{synthesis.background}</p>
        </Section>
      )}

      {synthesis.searchStrategySummary && (
        <Section title="Search Strategy">
          <p className="text-sm leading-relaxed text-paper-50/75">{synthesis.searchStrategySummary}</p>
        </Section>
      )}

      {synthesis.studies?.length > 0 && (
        <Section title="Study Characteristics">
          <div className="overflow-x-auto rounded-lg border border-ink-600">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-ink-900/60 text-paper-50/45">
                <tr>
                  {['Study', 'Design', 'Population', 'Comparator', 'Duration', 'Primary Outcome', 'Result'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 font-mono font-normal uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {synthesis.studies.map((s, i) => {
                  const p = papersByPmid[s.pmid]
                  return (
                    <tr key={i} className="border-t border-ink-700/60">
                      <td className="max-w-[180px] px-3 py-2.5 text-paper-50/85">{p?.title || s.pmid}</td>
                      <td className="px-3 py-2.5"><StudyBadge type={s.studyType} /></td>
                      <td className="max-w-[160px] px-3 py-2.5 text-paper-50/65">{s.population}</td>
                      <td className="px-3 py-2.5 text-paper-50/65">{s.comparator}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-paper-50/65">{s.duration}</td>
                      <td className="max-w-[160px] px-3 py-2.5 text-paper-50/65">{s.primaryOutcome}</td>
                      <td className="max-w-[180px] px-3 py-2.5 text-paper-50/75">{s.result}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {synthesis.keyFindings?.length > 0 && (
        <Section title="Key Findings">
          <div className="space-y-2.5">
            {synthesis.keyFindings.map((f, i) => (
              <Finding key={i} finding={f} papersByPmid={papersByPmid} />
            ))}
          </div>
        </Section>
      )}

      {synthesis.conflictingEvidence?.length > 0 && (
        <Section title="Conflicting Evidence">
          <div className="space-y-4">
            {synthesis.conflictingEvidence.map((c, i) => (
              <div key={i} className="rounded-lg border border-signal-amber/25 bg-signal-amber/[0.05] p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-signal-amber" />
                  <p className="text-sm font-medium text-paper-50">{c.topic}</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {c.positions?.map((pos, j) => (
                    <div key={j} className="rounded-md border border-ink-700 bg-ink-900/50 p-3">
                      <p className="text-xs leading-relaxed text-paper-50/80">{pos.summary}</p>
                      {pos.supportingPmids?.length > 0 && (
                        <p className="mt-1.5 font-mono text-[10px] text-paper-50/40">
                          PMID {pos.supportingPmids.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {c.possibleReasons?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-paper-50/40">Possible reasons for disagreement</p>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-paper-50/65">
                      {c.possibleReasons.map((r, k) => <li key={k}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {synthesis.synthesisNarrative && (
        <Section title="Evidence Synthesis">
          <p className="whitespace-pre-line text-sm leading-relaxed text-paper-50/75">{synthesis.synthesisNarrative}</p>
        </Section>
      )}

      {synthesis.limitations?.length > 0 && (
        <Section title="Limitations">
          <ul className="list-inside list-disc space-y-1 text-sm text-paper-50/70">
            {synthesis.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </Section>
      )}

      {synthesis.researchGaps?.length > 0 && (
        <Section title="Research Gaps">
          <ul className="list-inside list-disc space-y-1 text-sm text-paper-50/70">
            {synthesis.researchGaps.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </Section>
      )}

      {synthesis.conclusion && (
        <Section title="Conclusion">
          <p className="text-sm leading-relaxed text-paper-50/80">{synthesis.conclusion}</p>
        </Section>
      )}

      <Section title="References">
        <ol className="space-y-2.5 text-xs leading-relaxed text-paper-50/60">
          {papers.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-paper-50/35">[{i + 1}]</span>
              <button onClick={() => onOpenPaper?.(p)} className="focus-ring text-left hover:text-paper-50">{vancouver(p)}</button>
            </li>
          ))}
        </ol>
      </Section>

      <p className="mt-10 text-center text-[11px] text-paper-50/30">
        FEMTOLENS provides AI-assisted research synthesis and does not replace professional medical judgment, clinical guidelines, or expert review.
      </p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mt-9 border-t border-ink-700/60 pt-7">
      <h2 className="font-serif text-lg text-paper-50">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function buildPlainTextReport({ question, type, papers, synthesis }) {
  const lines = []
  lines.push(synthesis.title || question)
  lines.push('='.repeat((synthesis.title || question).length))
  lines.push('')
  lines.push(`Research Question: ${question}`)
  lines.push(`Type: ${type}`)
  lines.push('')
  if (synthesis.background) lines.push('BACKGROUND\n' + synthesis.background + '\n')
  if (synthesis.searchStrategySummary) lines.push('SEARCH STRATEGY\n' + synthesis.searchStrategySummary + '\n')
  if (synthesis.keyFindings?.length) {
    lines.push('KEY FINDINGS')
    synthesis.keyFindings.forEach((f) => lines.push('- ' + f.statement))
    lines.push('')
  }
  if (synthesis.synthesisNarrative) lines.push('EVIDENCE SYNTHESIS\n' + synthesis.synthesisNarrative + '\n')
  if (synthesis.limitations?.length) {
    lines.push('LIMITATIONS')
    synthesis.limitations.forEach((l) => lines.push('- ' + l))
    lines.push('')
  }
  if (synthesis.researchGaps?.length) {
    lines.push('RESEARCH GAPS')
    synthesis.researchGaps.forEach((g) => lines.push('- ' + g))
    lines.push('')
  }
  if (synthesis.conclusion) lines.push('CONCLUSION\n' + synthesis.conclusion + '\n')
  lines.push('REFERENCES')
  papers.forEach((p, i) => lines.push(`[${i + 1}] ${vancouver(p)}`))
  lines.push('')
  lines.push('FEMTOLENS provides AI-assisted research synthesis and does not replace professional medical judgment, clinical guidelines, or expert review.')
  return lines.join('\n')
}
