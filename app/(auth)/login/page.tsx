'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-white/10 bg-surface backdrop-blur">
        <h1 className="text-2xl font-bold text-center mb-2">ViWallet</h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          Smart multi-currency finance tracking
        </p>
        <Button onClick={signInWithGoogle} className="w-full" size="lg">
          Continue with Google
        </Button>
      </div>
    </div>
  )
}
