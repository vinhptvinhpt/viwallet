export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface-2 rounded-[var(--radius-md)] ${className}`}
      aria-hidden="true"
    />
  )
}
