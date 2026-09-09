import LensMark, { Wordmark } from './LensMark.jsx'
import {
  Plus, Clock, Bookmark, FileText, Newspaper, FlaskConical, BookOpenCheck,
  Database, Tags, Activity, Pill, Dna, Users, GitCompare, ShieldCheck,
  Search as SearchIcon, Quote, FolderKanban, StickyNote, FileBox, CreditCard,
} from 'lucide-react'

const SECTIONS = [
  {
    label: 'Research',
    items: [
      { key: 'new', label: 'New Research', icon: Plus, active: true },
      { key: 'active', label: 'Active Research', icon: Activity },
      { key: 'history', label: 'Research History', icon: Clock },
      { key: 'saved', label: 'Saved Research', icon: Bookmark },
    ],
  },
  {
    label: 'Literature',
    items: [
      { key: 'papers', label: 'Papers', icon: FileText },
      { key: 'journals', label: 'Journals', icon: Newspaper },
      { key: 'trials', label: 'Clinical Trials', icon: FlaskConical },
      { key: 'guidelines', label: 'Guidelines', icon: BookOpenCheck },
      { key: 'datasets', label: 'Datasets', icon: Database },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { key: 'topics', label: 'Topics', icon: Tags },
      { key: 'diseases', label: 'Diseases', icon: Activity },
      { key: 'drugs', label: 'Drugs', icon: Pill },
      { key: 'genes', label: 'Genes', icon: Dna },
      { key: 'biomarkers', label: 'Biomarkers', icon: GitCompare },
      { key: 'researchers', label: 'Researchers', icon: Users },
    ],
  },
  {
    label: 'Tools',
    items: [
      { key: 'lit-review', label: 'Literature Review', icon: BookOpenCheck },
      { key: 'comparator', label: 'Study Comparator', icon: GitCompare },
      { key: 'evidence-analyzer', label: 'Evidence Analyzer', icon: ShieldCheck },
      { key: 'trial-explorer', label: 'Clinical Trial Explorer', icon: SearchIcon },
      { key: 'citations', label: 'Citation Manager', icon: Quote },
      { key: 'gap-finder', label: 'Research Gap Finder', icon: SearchIcon },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { key: 'projects', label: 'Projects', icon: FolderKanban },
      { key: 'notes', label: 'Notes', icon: StickyNote },
      { key: 'documents', label: 'Documents', icon: FileBox },
      { key: 'reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'Account',
    items: [
      { key: 'plans', label: 'Plans & Usage', icon: CreditCard },
    ],
  },
]

export default function Sidebar({ activeKey, onNavigate, onLogoClick, user, subscription, onSignOut }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900/40 lg:flex">
      <button
        onClick={onLogoClick}
        className="focus-ring flex items-center gap-2 border-b border-ink-700/60 px-5 py-4 text-left text-lens-400"
      >
        <LensMark size={22} />
        <Wordmark className="text-base text-paper-50" />
      </button>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-paper-50/35">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ key, label, icon: Icon }) => {
                const isActive = activeKey === key
                return (
                  <button
                    key={key}
                    onClick={() => onNavigate(key)}
                    className={`focus-ring flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                      isActive
                        ? 'bg-lens-500/12 text-lens-400'
                        : 'text-paper-50/65 hover:bg-ink-800 hover:text-paper-50'
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-ink-700/60 px-4 py-3">
        {user ? (
          <button onClick={() => onNavigate('plans')} className="focus-ring flex w-full items-center gap-2.5 rounded-md px-1 py-1 text-left hover:bg-ink-800">
            {user.picture ? (
              <img src={user.picture} alt="" className="h-7 w-7 shrink-0 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-7 w-7 shrink-0 rounded-full bg-ink-700" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-paper-50">{user.name || user.email}</p>
              <p className="truncate text-[10px] text-lens-400/80">{subscription?.label || 'Trial'} plan</p>
            </div>
          </button>
        ) : (
          <p className="mb-2 text-[11px] text-paper-50/45">Sign in to run research</p>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-paper-50/35">
          Research intelligence, not clinical guidance.
        </p>
      </div>
    </aside>
  )
}
