import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { NavBar } from '@/components/NavBar'
import { CompareClient } from './CompareClient'

export default async function ComparePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profiles, builds] = await Promise.all([
    prisma.gearProfile.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    }),
    prisma.build.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, class: true },
    }),
  ])

  return (
    <div className="min-h-screen bg-d4-bg flex">
      <NavBar />
      <main className="flex-1 ml-16 lg:ml-52 p-6">
        <header className="mb-6">
          <h1 className="text-d4-gold font-diablo text-xl tracking-widest">Comparison</h1>
          <p className="text-d4-muted text-xs mt-0.5">
            Compare your current gear against your target build
          </p>
        </header>
        <CompareClient profiles={profiles} builds={builds} />
      </main>
    </div>
  )
}
