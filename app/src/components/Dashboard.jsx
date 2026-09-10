import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import NewResearch from './NewResearch.jsx'
import PlanView from './PlanView.jsx'
import LiveWorkspace from './LiveWorkspace.jsx'
import ReportView from './ReportView.jsx'
import PaperModal from './PaperModal.jsx'
import PlaceholderPanel from './PlaceholderPanel.jsx'
import GoogleSignInButton from './GoogleSignInButton.jsx'
import PricingCards from './PricingCards.jsx'
import UsageGauge from './UsageGauge.jsx'
import ActiveResearch from './ActiveResearch.jsx'
import ResearchHistory from './ResearchHistory.jsx'
import { Menu, ArrowLeft, LogOut } from 'lucide-react'
import { api } from '../lib/api.js'
import { depthAllowed } from '../lib/tiers.js'
import { useAuth } from '../lib/auth.jsx'
import LensMark, { Wordmark } from './LensMark.jsx'

export default function Dashboard({ initialQuestion, onExit }) {
  const { user, subscription, token, signOut, refresh } = useAuth()
  const [stage, setStage] = useState('form')
  const [navKey, setNavKey] = useState('new')
  const [form, setForm] = useState(null)
  const [plan, setPlan] = useState(null)
  const [planError, setPlanError] = useState(null)
  const [result, setResult] = useState(null)
  const [openPaper, setOpenPaper] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [gaugeKey, setGaugeKey] = useState(0)
  const [upgradeReason, setUpgradeReason] = useState('')

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

  const handleBegin = async (editedAreas) => {
    if (editedAreas && plan) setPlan({ ...plan, investigationAreas: editedAreas })
    if (!token || !user) {
      setStage('signin-required')
      return
    }
    await refresh(token)
    if (subscription && !depthAllowed(subscription.maxDepth, form.depth)) {
      setUpgradeReason(`Your ${subscription.label} plan supports up to "${subscription.maxDepth}" depth. Choose a lower depth or upgrade.`)
      setStage('upgrade-required')
      return
    }
    if (subscription && subscription.runsUsed >= subscription.runsLimit) {
      setUpgradeReason(`You've used all ${subscription.runsLimit} research runs on your ${subscription.label} plan this period. Upgrade for more, or wait for your period to reset.`)
      setStage('upgrade-required')
      return
    }
    setStage('workspace')
  }

  const handleWorkspaceComplete = (res) => {
    setResult(res)
    setStage('report')
    setGaugeKey((k) => k + 1)
    refresh(token)
  }

  const handleOpenRun = (run) => {
    setForm({ question: run.question, type: run.type, depth: run.depth })
    setResult({ papers: run.papers || [], synthesis: run.synthesis || {} })
    setStage('report')
  }

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar activeKey={navKey} onNavigate={handleNavigate} onLogoClick={onExit} user={user} subscription={subscription} />

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
            <button onClick={() => handleNavigate('plans')} className="focus-ring ml-4 text-sm text-paper-50/70">Plans &amp; Usage</button>
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

          {stage === 'signin-required' && (
            <div className="mx-auto max-w-md px-6 py-24 text-center">
              <h2 className="font-serif text-xl text-paper-50">Sign in to run this research</h2>
              <p className="mt-2 text-sm text-paper-50/55">
                Exploring plans is free. Running the literature search and evidence synthesis needs an account
                so we can track your plan's monthly research runs.
              </p>
              <div className="mt-6 flex justify-center">
                <GoogleSignInButton onSuccess={handleBegin} />
              </div>
              <button onClick={() => setStage('plan')} className="focus-ring mt-5 text-xs text-paper-50/40 hover:text-paper-50">
                Back to plan
              </button>
            </div>
          )}

          {stage === 'upgrade-required' && (
            <div className="mx-auto max-w-3xl px-6 py-12">
              <h2 className="font-serif text-2xl text-paper-50">Upgrade to continue</h2>
              <div className="mt-6">
                <PricingCards currentTier={subscription?.tier} reason={upgradeReason} />
              </div>
              <button onClick={() => setStage('plan')} className="focus-ring mt-6 text-xs text-paper-50/40 hover:text-paper-50">
                Back to plan
              </button>
            </div>
          )}

          {stage === 'workspace' && form && (
            <LiveWorkspace
              question={form.question}
              type={form.type}
              depth={form.depth}
              areas={plan?.investigationAreas || []}
              token={token}
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

          {stage === 'placeholder' && navKey !== 'plans' && navKey !== 'active' && navKey !== 'history' && <PlaceholderPanel label={labelFor(navKey)} onNew={goNew} />}

          {stage === 'placeholder' && navKey === 'active' && (
            <ActiveResearch onOpenRun={handleOpenRun} onNew={goNew} />
          )}

          {stage === 'placeholder' && navKey === 'history' && (
            <ResearchHistory onOpenRun={handleOpenRun} onNew={goNew} />
          )}

          {stage === 'placeholder' && navKey === 'plans' && (
            <div className="mx-auto max-w-3xl px-6 py-12">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-lens-400/80">Account</p>
              <h1 className="mt-3 font-serif text-2xl text-paper-50">Plans &amp; Usage</h1>

              {user ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-600 bg-ink-900/40 p-4">
                  <div className="flex items-center gap-3">
                    {user.picture && <img src={user.picture} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />}
                    <div>
                      <p className="text-sm font-medium text-paper-50">{user.name || user.email}</p>
                      <p className="text-xs text-paper-50/50">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={signOut} className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 text-xs text-paper-50/70 hover:border-signal-coral/50 hover:text-signal-coral">
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-ink-600 bg-ink-900/40 p-5 text-center">
                  <p className="mb-3 text-sm text-paper-50/60">Sign in to see your plan and research run usage.</p>
                  <div className="flex justify-center"><GoogleSignInButton /></div>
                </div>
              )}

              {subscription && (
                <p className="mt-4 text-xs text-paper-50/50">
                  {subscription.runsUsed} / {subscription.runsLimit} research runs used this period · resets {new Date(subscription.periodEnd).toLocaleDateString()}
                </p>
              )}

              <div className="mt-6 max-w-xs">
                <UsageGauge refreshKey={gaugeKey} />
              </div>

              <div className="mt-8">
                <PricingCards currentTier={subscription?.tier} />
              </div>
            </div>
          )}
        </div>
      </div>

      <PaperModal paper={openPaper} onClose={() => setOpenPaper(null)} />
    </div>
  )
}

function labelFor(key) {
  const map = {
    saved: 'Saved Research',
    papers: 'Papers', journals: 'Journals', trials: 'Clinical Trials', guidelines: 'Guidelines', datasets: 'Datasets',
    topics: 'Topics', diseases: 'Disease Intelligence', drugs: 'Drug Intelligence', genes: 'Gene Research',
    biomarkers: 'Biomarker Research', researchers: 'Researchers',
    'lit-review': 'Literature Review Workspace', comparator: 'Study Comparator', 'evidence-analyzer': 'Evidence Analyzer',
    'trial-explorer': 'Clinical Trial Explorer', citations: 'Citation Manager', 'gap-finder': 'Research Gap Finder',
    projects: 'Projects', notes: 'Notes', documents: 'Documents', reports: 'Reports',
  }
  return map[key] || 'Coming soon'
}
