export default function LensMark({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="21" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.9" />
      <circle cx="32" cy="32" r="12.5" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
      <circle cx="32" cy="32" r="3.2" fill="currentColor" />
      <path d="M32 6 V2 M32 62 V58 M6 32 H2 M62 32 H58" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
    </svg>
  )
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`font-serif tracking-tight ${className}`}>
      FEMTO<span className="text-lens-400">LENS</span>
    </span>
  )
}
