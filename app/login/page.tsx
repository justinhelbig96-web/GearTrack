'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Login failed')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-d4-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-d4-gold text-5xl">⚔</span>
          <h1 className="text-d4-gold font-diablo text-3xl tracking-widest mt-2">GearGap</h1>
          <p className="text-d4-muted text-sm mt-1">Diablo 4 Gear Companion</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-d4-panel border border-d4-border rounded-lg p-6 space-y-4 shadow-panel"
        >
          <h2 className="text-d4-gold font-diablo text-sm uppercase tracking-widest">Sign In</h2>

          <div>
            <label className="block text-xs text-d4-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-d4-surface border border-d4-border rounded px-3 py-2 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
            />
          </div>

          <div>
            <label className="block text-xs text-d4-muted mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-d4-surface border border-d4-border rounded px-3 py-2 pr-10 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-d4-muted hover:text-d4-text"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-cmp-bad text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-d4-gold/20 hover:bg-d4-gold/30 border border-d4-gold/40 text-d4-gold rounded py-2 text-sm font-diablo tracking-wide transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-d4-muted">
            No account?{' '}
            <Link href="/register" className="text-d4-gold hover:text-d4-text transition-colors">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
