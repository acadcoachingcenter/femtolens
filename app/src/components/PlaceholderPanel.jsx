import { Construction } from 'lucide-react'

export default function PlaceholderPanel({ label, onNew }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <Construction size={22} className="text-paper-50/30" />
      <h2 className="mt-4 font-serif text-xl text-paper-50">{label}</h2>
      <p className="mt-2 max-w-sm text-sm text-paper-50/55">
        This module is on the FEMTOLENS roadmap and isn't wired up in this build yet.
        The research pipeline — plan, literature discovery, evidence, and report — is fully live.
      </p>
      <button
        onClick={onNew}
        className="focus-ring mt-6 rounded-md bg-lens-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-lens-400"
      >
        Start a research question
      </button>
    </div>
  )
}
