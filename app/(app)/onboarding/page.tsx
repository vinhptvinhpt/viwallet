export const dynamic = 'force-dynamic'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-white/10 bg-surface">
        <h1 className="text-2xl font-bold text-center mb-2">Welcome to WalletWise</h1>
        <p className="text-slate-400 text-center text-sm">
          Set up your first wallet to get started.
        </p>
      </div>
    </div>
  )
}
