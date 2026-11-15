export default function AppLoading() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-surface-2 rounded-xl" />
          <div className="h-4 w-64 bg-surface-2/60 rounded-lg" />
        </div>
        <div className="h-10 w-28 bg-surface-2 rounded-xl" />
      </div>

      {/* Metric card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-28 rounded-2xl bg-surface border border-hairline p-5 space-y-3">
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="h-7 w-32 bg-surface-2 rounded-lg" />
        </div>
        <div className="h-28 rounded-2xl bg-surface border border-hairline p-5 space-y-3">
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="h-7 w-32 bg-surface-2 rounded-lg" />
        </div>
      </div>

      {/* List section skeletons */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-surface-2 rounded" />
        <div className="space-y-2.5">
          <div className="h-20 rounded-2xl bg-surface border border-hairline p-4" />
          <div className="h-20 rounded-2xl bg-surface border border-hairline p-4" />
          <div className="h-20 rounded-2xl bg-surface border border-hairline p-4" />
        </div>
      </div>
    </div>
  )
}
