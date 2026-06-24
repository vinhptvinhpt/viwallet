import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 lg:pb-0 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
