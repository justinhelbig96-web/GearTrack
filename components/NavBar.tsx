'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Shield, LayoutDashboard, BookOpen, BarChart2, LogOut } from 'lucide-react'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/armory',    label: 'Armory',    icon: Shield },
  { href: '/build',     label: 'Build',     icon: BookOpen },
  { href: '/compare',   label: 'Compare',   icon: BarChart2 },
]

export function NavBar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-16 lg:w-52 bg-d4-surface border-r border-d4-border flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-d4-border">
        <span className="text-d4-gold text-2xl">⚔</span>
        <span className="hidden lg:block text-d4-gold font-diablo text-lg tracking-widest">GearGap</span>
      </div>

      {/* Links */}
      <div className="flex-1 flex flex-col gap-1 p-2 pt-4">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded transition-all duration-150 group',
              pathname.startsWith(href)
                ? 'bg-d4-border/50 text-d4-gold border border-d4-gold/30'
                : 'text-d4-muted hover:text-d4-text hover:bg-d4-border/30'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden lg:block text-sm font-diablo tracking-wide">{label}</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-d4-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded text-d4-muted hover:text-cmp-bad hover:bg-d4-border/30 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className="hidden lg:block text-sm font-diablo tracking-wide">Logout</span>
        </button>
      </div>
    </nav>
  )
}
