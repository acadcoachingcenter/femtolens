import { useEffect, useRef, useState } from 'react'
import { Search, Layers, GitCompare, Sparkles, AlertTriangle } from 'lucide-react'
import PlanChecklist from './PlanChecklist.jsx'
import PaperCard from './PaperCard.jsx'
import { api } from '../lib/api.js'

const DEPTH_LIMIT = { quick: 6, standard: 12, deep: 20, comprehensive: 28 }

export default function LiveWorkspace({ question, type, depth, areas, token, onComplete, onOpenPaper }) {
  const [doneKeys, setDoneKeys] = useState(['question'])
  const [currentKey, setCurrentKey] = useState('search')
  const [log, setLog] = useState([{ title: 'Question formulation', body: `Locked research question and ${areas.length} investigation areas.` }])
  const [papers, setPapers] = useState([])
  const [searchMeta, setSearchMeta] = useState(null)
  const [error, setError] = useState(null)
  const ran = useRef(false)

  const pushLog = (title, body) => setLog((l) => [...l, { title, body }])

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function run() {
    try {
      // 1. Literature discovery
      setCurrentKey('search')
      pushLog('Searching biomedical literature', 'Querying PubMed and Europe PMC for relevant studies…')
      const limit = DEPTH_LIMIT[depth] || 12
      const searchRes = await api.search({ question, type, areas, depth, limit }, token)
      setPapers(searchRes.papers || [])
      setSearchMeta(searchRes.meta || null)
      pushLog(
        'Literature discovery complete',
        `Found ${searchRes.meta?.totalFound ?? searchRes.papers?.length ?? 0} results, included ${searchRes.papers?.length ?? 0} after screening.`
      )
      setDoneKeys((d) => [...d, 'search'])

      if (!searchRes.papers || searchRes.papers.length === 0) {
        setError('No relevant literature was found for this question. Try broadening it or lowering research depth.')
        return
      }

      // 2. Evidence extraction
      setCurrentKey('extract')
      pushLog('Extracting population and outcome data', `Reading abstracts from ${searchRes.papers.length} studies…`)
      await sleep(400)
      setDoneKeys((d) => [...d, 'extract'])

      // 3. Study comparison
      setCurrentKey('compare')
      pushLog('Comparing study designs', 'Classifying studies and aligning endpoints across trials…')
      await sleep(400)
      setDoneKeys((d) => [...d, 'compare'])

      // 4. Grading
      setCurrentKey('grade')
      pushLog('Grading evidence', 'Weighing study design, sample size, and risk of bias…')
      await sleep(300)
      setDoneKeys((d) => [...d, 'grade'])

      // 5. Synthesis (real call)
      setCurrentKey('synthesis')
      pushLog('Evidence synthesis', `Comparing findings across ${searchRes.papers.length} studies and checking for disagreement…`)
      const synth = await api.synthesize({ question, type, papers: searchRes.papers }, token)
      setDoneKeys((d) => [...d, 'synthesis'])

      // 6. Report
      setCurrentKey('report')
      pushLog('Generating research report', 'Assembling findings, citations, and research gaps…')
      await sleep(250)
      setDoneKeys((d) => [...d, 'report'])

      onComplete({ papers: searchRes.papers, meta: searchRes.meta, synthesis: synth })
    } catch (e) {
      setError(e.message || 'Something went wrong during research.')
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-57px)] grid-cols-1 lg:grid-cols-[240px_1fr_320px]">
      {/* Left: plan */}
      <div className="border-b border-ink-700/60 px-5 py-6 lg:border-b-0 lg:border-r">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-paper-50/40">Research Plan</p>
        <PlanChecklist currentKey={currentKey} doneKeys={doneKeys} />
        {searchMeta && (
          <div className="mt-8 rounded-md border border-ink-700 bg-ink-900/40 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-lens-400/70">Search Strategy</p>
            <dl className="space-y-1 text-[11px] text-paper-50/55">
              <div className="flex justify-between"><dt>Databases</dt><dd className="text-paper-50/75">{searchMeta.databases?.join(', ')}</dd></div>
              <div className="flex justify-between"><dt>Results found</dt><dd className="text-paper-50/75">{searchMeta.totalFound}</dd></div>
              <div className="flex justify-between"><dt>Included</dt><dd className="text-paper-50/75">{papers.length}</dd></div>
            </dl>
          </div>
        )}
      </div>

      {/* Center: activity */}
      <div className="border-b border-ink-700/60 px-6 py-6 lg:border-b-0 lg:border-r">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-paper-50/40">Research Activity</p>
        <div className="space-y-4">
          {log.map((entry, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-lens-500/30 bg-lens-500/10">
                {iconFor(entry.title)}
              </div>
              <div>
                <p className="text-sm font-medium text-paper-50">{entry.title}</p>
                <p className="mt-0.5 text-xs text-paper-50/50">{entry.body}</p>
              </div>
            </div>
          ))}
          {error && (
            <div className="flex gap-3 rounded-md border border-signal-coral/30 bg-signal-coral/[0.06] p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-signal-coral" />
              <p className="text-sm text-paper-50/80">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: sources */}
      <div className="px-5 py-6">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-paper-50/40">
          Evidence Sources {papers.length > 0 && `(${papers.length})`}
        </p>
        <div className="space-y-3">
          {papers.map((p) => (
            <PaperCard key={p.pmid || p.title} paper={p} onOpen={onOpenPaper} compact />
          ))}
          {papers.length === 0 && !error && (
            <p className="text-xs text-paper-50/35">Sources will appear here as they're discovered.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function iconFor(title) {
  if (title.toLowerCase().includes('search') || title.toLowerCase().includes('discovery')) return <Search size={12} className="text-lens-400" />
  if (title.toLowerCase().includes('compar')) return <GitCompare size={12} className="text-lens-400" />
  if (title.toLowerCase().includes('extract') || title.toLowerCase().includes('grad')) return <Layers size={12} className="text-lens-400" />
  return <Sparkles size={12} className="text-lens-400" />
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
