import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { NavBar } from '@/components/NavBar'
import { BuildClient } from './BuildClient'

export default async function BuildPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const builds = await prisma.build.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, class: true, updatedAt: true },
  })

  return (
    <div className="min-h-screen bg-d4-bg flex">
      <NavBar />
      <main className="flex-1 ml-16 lg:ml-52 p-6">
        <header className="mb-6">
          <h1 className="text-d4-gold font-diablo text-xl tracking-widest">Target Build</h1>
          <p className="text-d4-muted text-xs mt-0.5">
            Define the stat requirements for each gear slot
          </p>
        </header>
        <BuildClient builds={builds} />
      </main>
    </div>
  )
}
