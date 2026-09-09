import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import NewResearch from './NewResearch.jsx'
import PlanView from './PlanView.jsx'
import LiveWorkspace from './LiveWorkspace.jsx'
import ReportView from './ReportView.jsx'
import PaperModal from './PaperModal.jsx'
import PlaceholderPanel from './PlaceholderPanel.jsx'
import { Menu, ArrowLeft } from 'lucide-react'
import { api } from '../lib/api.js'
import LensMark, { Wordmark } from './LensMark.jsx'

export default function Dashboard({ initialQuestion, onExit }) {
  const [stage, setStage] = useState('form') // form | planning | plan | workspace | report | placeholder
  const [navKey, setNavKey] = useState('new')
  const [form, setForm] = useState(null)
  const [plan, setPlan] = useState(null)
  const [planError, setPlanError] = useState(null)
  const [result, setResult] = useState(null)
  const [openPaper, setOpenPaper] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const goNew = () => {
    setStage('form')
    setNavKey('new')
    setForm(null)
    setPlan(null)
    setResult(null)
  }

  const handleNavigate = (key) => {
    setNavKey(key)
    setMobileNavOpen(false)
    if (key === 'new') return goNew()
    setStage('placeholder')
  }

  const handleSubmitQuestion = async (payload) => {
    setForm(payload)
    setStage('planning')
    setPlanError(null)
    try {
      const p = await api.plan(payload)
      setPlan(p)
      setStage('plan')
    } catch (e) {
      setPlanError(e.message || 'Could not reach the research planner.')
      setStage('plan')
    }
  }

  const handleBegin = (areas) => {
    setStage('workspace')
  }

  const handleWorkspaceComplete = (res) => {
    setResult(res)
    setStage('report')
  }

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar activeKey={navKey} onNavigate={handleNavigate} onLogoClick={onExit} />

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-3 lg:hidden">
          <button onClick={onExit} className="focus-ring flex items-center gap-2 text-lens-400">
            <LensMark size={20} />
            <Wordmark className="text-sm text-paper-50" />
          </button>
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="focus-ring text-paper-50/70" aria-label="Toggle navigation">
            <Menu size={20} />
          </button>
        </div>
        {mobileNavOpen && (
          <div className="border-b border-ink-700/60 px-4 py-3 lg:hidden">
            <button onClick={() => handleNavigate('new')} className="focus-ring text-sm text-lens-400">+ New Research</button>
          </div>
        )}

        {stage !== 'form' && stage !== 'placeholder' && (
          <div className="border-b border-ink-700/60 px-6 py-2.5">
            <button onClick={goNew} className="focus-ring inline-flex items-center gap-1.5 text-xs text-paper-50/45 hover:text-paper-50">
              <ArrowLeft size={12} /> New research question
            </button>
          </div>
        )}

        <div className="flex-1">
          {stage === 'form' && <NewResearch initialQuestion={initialQuestion} onSubmit={handleSubmitQuestion} />}

          {(stage === 'planning' || stage === 'plan') && (
            <PlanView
              loading={stage === 'planning'}
              error={planError}
              plan={plan}
              onBegin={handleBegin}
              onRetry={() => handleSubmitQuestion(form)}
            />
          )}

          {stage === 'workspace' && form && (
            <LiveWorkspace
              question={form.question}
              type={form.type}
              depth={form.depth}
              areas={plan?.investigationAreas || []}
              onComplete={handleWorkspaceComplete}
              onOpenPaper={setOpenPaper}
            />
          )}

          {stage === 'report' && result && (
            <ReportView
              question={form.question}
              type={form.type}
              papers={result.papers}
              synthesis={result.synthesis}
              onOpenPaper={setOpenPaper}
            />
          )}

          {stage === 'placeholder' && <PlaceholderPanel label={labelFor(navKey)} onNew={goNew} />}
        </div>
      </div>

      <PaperModal paper={openPaper} onClose={() => setOpenPaper(null)} />
    </div>
  )
}

function labelFor(key) {
  const map = {
    active: 'Active Research', history: 'Research History', saved: 'Saved Research',
    papers: 'Papers', journals: 'Journals', trials: 'Clinical Trials', guidelines: 'Guidelines', datasets: 'Datasets',
    topics: 'Topics', diseases: 'Disease Intelligence', drugs: 'Drug Intelligence', genes: 'Gene Research',
    biomarkers: 'Biomarker Research', researchers: 'Researchers',
    'lit-review': 'Literature Review Workspace', comparator: 'Study Comparator', 'evidence-analyzer': 'Evidence Analyzer',
    'trial-explorer': 'Clinical Trial Explorer', citations: 'Citation Manager', 'gap-finder': 'Research Gap Finder',
    projects: 'Projects', notes: 'Notes', documents: 'Documents', reports: 'Reports',
  }
  return map[key] || 'Coming soon'
}
