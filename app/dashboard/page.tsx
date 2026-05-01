import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { NavBar } from '@/components/NavBar'
import Link from 'next/link'
import { Shield, BookOpen, BarChart2, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [profileCount, buildCount, itemCount] = await Promise.all([
    prisma.gearProfile.count({ where: { userId: user.id } }),
    prisma.build.count({ where: { userId: user.id } }),
    prisma.item.count({ where: { userId: user.id } }),
  ])

  const activeProfile = await prisma.gearProfile.findFirst({
    where: { userId: user.id, isActive: true },
    select: {
      name: true,
      class: true,
      helmet:   { select: { itemName: true } },
      chest:    { select: { itemName: true } },
      gloves:   { select: { itemName: true } },
      pants:    { select: { itemName: true } },
      boots:    { select: { itemName: true } },
      amulet:   { select: { itemName: true } },
      ring1:    { select: { itemName: true } },
      ring2:    { select: { itemName: true } },
      mainHand: { select: { itemName: true } },
      offHand:  { select: { itemName: true } },
    },
  })

  const slottedItems = activeProfile
    ? [
        activeProfile.helmet, activeProfile.chest, activeProfile.gloves,
        activeProfile.pants, activeProfile.boots, activeProfile.amulet,
        activeProfile.ring1, activeProfile.ring2, activeProfile.mainHand,
        activeProfile.offHand,
      ].filter(Boolean).length
    : 0

  const QUICK_LINKS = [
    { href: '/armory',  label: 'Armory',    icon: Shield,   desc: 'Upload gear screenshots' },
    { href: '/build',   label: 'Build',     icon: BookOpen, desc: 'Define your target build' },
    { href: '/compare', label: 'Compare',   icon: BarChart2, desc: 'See what is missing' },
  ]

  return (
    <div className="min-h-screen bg-d4-bg flex">
      <NavBar />
      <main className="flex-1 ml-16 lg:ml-52 p-6">
        {/* Welcome */}
        <header className="mb-8">
          <h1 className="text-d4-gold font-diablo text-2xl tracking-widest">
            Welcome, {user.name ?? user.email}
          </h1>
          <p className="text-d4-muted text-sm mt-1">Your Diablo 4 gear companion</p>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Gear Profiles', value: profileCount },
            { label: 'Items Tracked', value: itemCount },
            { label: 'Target Builds', value: buildCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-d4-panel border border-d4-border rounded-lg p-4 text-center">
              <p className="text-d4-gold font-diablo text-3xl">{value}</p>
              <p className="text-d4-muted text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Active profile */}
        {activeProfile && (
          <div className="bg-d4-panel border border-d4-border rounded-lg p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-d4-gold font-diablo text-sm uppercase tracking-widest">
                  Active Profile
                </h2>
                <p className="text-d4-text text-base mt-0.5">
                  {activeProfile.name}
                  {activeProfile.class && <span className="text-d4-muted ml-2 text-sm">— {activeProfile.class}</span>}
                </p>
              </div>
              <Link href="/armory" className="flex items-center gap-1 text-d4-gold text-xs hover:text-d4-text transition-colors">
                Open Armory <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-d4-border rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-d4-gold/60 rounded-full transition-all"
                  style={{ width: `${(slottedItems / 10) * 100}%` }}
                />
              </div>
              <span className="text-d4-muted text-xs font-mono">{slottedItems}/10 slots filled</span>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group bg-d4-panel border border-d4-border rounded-lg p-5 hover:border-d4-gold/60 hover:shadow-slot transition-all"
            >
              <Icon className="h-6 w-6 text-d4-gold mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-d4-text font-diablo text-sm mb-1">{label}</h3>
              <p className="text-d4-muted text-xs">{desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
