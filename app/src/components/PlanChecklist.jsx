import { Check, Circle, Loader2 } from 'lucide-react'

const STEPS = [
  { key: 'question', label: 'Question formulation' },
  { key: 'search', label: 'Literature discovery' },
  { key: 'extract', label: 'Evidence extraction' },
  { key: 'compare', label: 'Study comparison' },
  { key: 'grade', label: 'Evidence grading' },
  { key: 'synthesis', label: 'Synthesis' },
  { key: 'report', label: 'Report generation' },
]

export default function PlanChecklist({ currentKey, doneKeys = [] }) {
  return (
    <div className="space-y-1">
      {STEPS.map((step) => {
        const done = doneKeys.includes(step.key)
        const active = currentKey === step.key
        return (
          <div key={step.key} className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            {done ? (
              <Check size={14} className="shrink-0 text-lens-400" />
            ) : active ? (
              <Loader2 size={14} className="shrink-0 animate-spin text-lens-400" />
            ) : (
              <Circle size={11} className="shrink-0 text-paper-50/25" />
            )}
            <span className={`text-sm ${done ? 'text-paper-50/70' : active ? 'text-paper-50' : 'text-paper-50/40'}`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { STEPS }
