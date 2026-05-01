'use client'

import { useState } from 'react'
import { ComparisonView } from '@/components/ComparisonView'
import type { BuildComparison } from '@/lib/types'
import { BarChart2, Loader2 } from 'lucide-react'

interface CompareClientProps {
  profiles: { id: string; name: string }[]
  builds:   { id: string; name: string; class: string | null }[]
}

export function CompareClient({ profiles, builds }: CompareClientProps) {
  const [profileId, setProfileId]   = useState('')
  const [buildId, setBuildId]       = useState('')
  const [running, setRunning]       = useState(false)
  const [result, setResult]         = useState<BuildComparison | null>(null)
  const [error, setError]           = useState<string | null>(null)

  async function handleRun() {
    if (!profileId || !buildId) return
    setRunning(true)
    setError(null)
    setResult(null)

    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, buildId }),
    })

    setRunning(false)

    if (!res.ok) {
      const err = await res.json()
      setError(err.error ?? 'Comparison failed')
      return
    }

    const data = await res.json()
    setResult(data.comparison)
  }

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <div className="bg-d4-panel border border-d4-border rounded-lg p-5 space-y-4">
        <h2 className="text-d4-gold font-diablo text-sm uppercase tracking-widest">
          Run Comparison
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-d4-muted mb-1">Gear Profile</label>
            <select
              value={profileId}
              onChange={e => setProfileId(e.target.value)}
              className="w-full bg-d4-surface border border-d4-border rounded px-3 py-1.5 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
            >
              <option value="">Select profile…</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-d4-muted mb-1">Target Build</label>
            <select
              value={buildId}
              onChange={e => setBuildId(e.target.value)}
              className="w-full bg-d4-surface border border-d4-border rounded px-3 py-1.5 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
            >
              <option value="">Select build…</option>
              {builds.map(b => (
                <option key={b.id} value={b.id}>{b.name}{b.class ? ` (${b.class})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={!profileId || !buildId || running}
          className="flex items-center gap-2 bg-d4-gold/20 hover:bg-d4-gold/30 border border-d4-gold/40 text-d4-gold rounded px-4 py-2 text-sm font-diablo tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart2 className="h-4 w-4" />}
          {running ? 'Comparing…' : 'Run Comparison'}
        </button>

        {error && <p className="text-cmp-bad text-sm">{error}</p>}
      </div>

      {/* Results */}
      {result && <ComparisonView comparison={result} />}

      {!result && !running && (
        <div className="text-d4-muted text-sm text-center py-12">
          Select a gear profile and a target build, then click <strong>Run Comparison</strong>.
        </div>
      )}
    </div>
  )
}
