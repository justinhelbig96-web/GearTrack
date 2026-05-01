'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: name || undefined }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Registration failed')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-d4-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-d4-gold text-5xl">⚔</span>
          <h1 className="text-d4-gold font-diablo text-3xl tracking-widest mt-2">GearGap</h1>
          <p className="text-d4-muted text-sm mt-1">Create your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-d4-panel border border-d4-border rounded-lg p-6 space-y-4 shadow-panel"
        >
          <h2 className="text-d4-gold font-diablo text-sm uppercase tracking-widest">Register</h2>

          <div>
            <label className="block text-xs text-d4-muted mb-1">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              className="w-full bg-d4-surface border border-d4-border rounded px-3 py-2 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
            />
          </div>

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
            <label className="block text-xs text-d4-muted mb-1">Password (min 8 chars)</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-d4-surface border border-d4-border rounded px-3 py-2 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
            />
          </div>

          {error && <p className="text-cmp-bad text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-d4-gold/20 hover:bg-d4-gold/30 border border-d4-gold/40 text-d4-gold rounded py-2 text-sm font-diablo tracking-wide transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-d4-muted">
            Have an account?{' '}
            <Link href="/login" className="text-d4-gold hover:text-d4-text transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
