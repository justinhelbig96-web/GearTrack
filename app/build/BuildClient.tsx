'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseBuildText } from '@/lib/parser/d4parser'
import type { BuildSlotData, GearSlot } from '@/lib/types'
import { GEAR_SLOTS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Plus, Save, FileText, Trash2 } from 'lucide-react'

const D4_CLASSES = ['Barbarian', 'Druid', 'Necromancer', 'Rogue', 'Sorcerer', 'Spiritborn']

interface BuildClientProps {
  builds: { id: string; name: string; class: string | null; updatedAt: Date }[]
}

export function BuildClient({ builds }: BuildClientProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [heroClass, setHeroClass] = useState('')
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<BuildSlotData>({})
  const [saving, setSaving] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [tab, setTab] = useState<'paste' | 'manual'>('paste')

  // Manual slot requirements
  const [manualSlots, setManualSlots] = useState<Partial<Record<GearSlot, string>>>({})

  function handleParseText() {
    const result = parseBuildText(rawText)
    setParsed(result)
  }

  function updateManualSlot(slot: GearSlot, value: string) {
    setManualSlots(prev => ({ ...prev, [slot]: value }))
  }

  function buildSlotsFromManual(): BuildSlotData {
    const result: BuildSlotData = {}
    for (const { slot } of GEAR_SLOTS) {
      const raw = manualSlots[slot]
      if (!raw?.trim()) continue
      const affixNames = raw.split(',').map(a => a.trim()).filter(Boolean)
      result[slot] = {
        slot,
        affixes: affixNames.map(n => ({ name: n, required: true })),
      }
    }
    return result
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    const slots = tab === 'paste' ? parsed : buildSlotsFromManual()

    const res = await fetch('/api/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        class: heroClass || null,
        rawText: rawText || null,
        slots,
        sourceUrl: sourceUrl || null,
      }),
    })

    setSaving(false)
    if (res.ok) {
      router.refresh()
      setName('')
      setRawText('')
      setParsed({})
      setManualSlots({})
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/builds/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Create */}
      <div className="bg-d4-panel border border-d4-border rounded-lg p-5 space-y-4">
        <h2 className="text-d4-gold font-diablo text-sm uppercase tracking-widest">
          New Target Build
        </h2>

        {/* Name */}
        <div>
          <label className="block text-xs text-d4-muted mb-1">Build Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Lightning Sorcerer S4"
            className="w-full bg-d4-surface border border-d4-border rounded px-3 py-1.5 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
          />
        </div>

        {/* Class */}
        <div>
          <label className="block text-xs text-d4-muted mb-1">Class</label>
          <select
            value={heroClass}
            onChange={e => setHeroClass(e.target.value)}
            className="w-full bg-d4-surface border border-d4-border rounded px-3 py-1.5 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
          >
            <option value="">Select class…</option>
            {D4_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Source URL */}
        <div>
          <label className="block text-xs text-d4-muted mb-1">Source URL (optional)</label>
          <input
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            placeholder="https://maxroll.gg/d4/…"
            className="w-full bg-d4-surface border border-d4-border rounded px-3 py-1.5 text-d4-text text-sm focus:outline-none focus:border-d4-gold/60"
          />
        </div>

        {/* Tab selector */}
        <div className="flex border border-d4-border rounded overflow-hidden">
          <button
            onClick={() => setTab('paste')}
            className={cn('flex-1 py-1.5 text-xs transition-colors', tab === 'paste' ? 'bg-d4-gold/20 text-d4-gold' : 'text-d4-muted hover:text-d4-text')}
          >
            <FileText className="inline h-3 w-3 mr-1" /> Paste Text
          </button>
          <button
            onClick={() => setTab('manual')}
            className={cn('flex-1 py-1.5 text-xs transition-colors', tab === 'manual' ? 'bg-d4-gold/20 text-d4-gold' : 'text-d4-muted hover:text-d4-text')}
          >
            <Plus className="inline h-3 w-3 mr-1" /> Manual
          </button>
        </div>

        {tab === 'paste' ? (
          <div className="space-y-2">
            <label className="block text-xs text-d4-muted">
              Paste Maxroll-style text (e.g. <code className="text-d4-gold">Helmet: Cooldown Reduction, Max Life</code>)
            </label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={`Helmet: Cooldown Reduction, Max Life, Armor\nGloves: Attack Speed, Crit Chance\nBoots: Movement Speed, Dodge Chance`}
              rows={8}
              className="w-full bg-d4-surface border border-d4-border rounded px-3 py-2 text-d4-text text-xs font-mono focus:outline-none focus:border-d4-gold/60 resize-none"
            />
            <button
              onClick={handleParseText}
              className="text-xs text-d4-gold hover:text-d4-text border border-d4-gold/30 hover:border-d4-gold rounded px-3 py-1 transition-colors"
            >
              Parse Text
            </button>
            {Object.keys(parsed).length > 0 && (
              <div className="bg-d4-surface rounded p-3 border border-d4-border/50">
                <p className="text-xs text-cmp-good mb-1">Parsed {Object.keys(parsed).length} slots</p>
                {Object.entries(parsed).map(([slot, req]) => (
                  <p key={slot} className="text-xs text-d4-muted">
                    <span className="text-d4-text">{slot}:</span>{' '}
                    {req.affixes.map(a => a.name).join(', ')}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {GEAR_SLOTS.map(({ slot, label }) => (
              <div key={slot}>
                <label className="block text-xs text-d4-muted mb-0.5">{label}</label>
                <input
                  value={manualSlots[slot] ?? ''}
                  onChange={e => updateManualSlot(slot, e.target.value)}
                  placeholder="Attack Speed, Crit Chance, …"
                  className="w-full bg-d4-surface border border-d4-border rounded px-2 py-1 text-d4-text text-xs focus:outline-none focus:border-d4-gold/60"
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="w-full flex items-center justify-center gap-2 bg-d4-gold/20 hover:bg-d4-gold/30 border border-d4-gold/40 text-d4-gold rounded py-2 text-sm font-diablo tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Build'}
        </button>
      </div>

      {/* Right: Saved builds */}
      <div className="space-y-3">
        <h2 className="text-d4-gold font-diablo text-sm uppercase tracking-widest">Saved Builds</h2>
        {builds.length === 0 ? (
          <p className="text-d4-muted text-sm">No builds yet. Create one on the left.</p>
        ) : (
          builds.map(build => (
            <div key={build.id} className="bg-d4-panel border border-d4-border rounded-lg p-4 flex items-center justify-between group">
              <div>
                <p className="text-d4-text text-sm font-diablo">{build.name}</p>
                {build.class && <p className="text-d4-muted text-xs">{build.class}</p>}
                <p className="text-d4-muted text-xs">
                  {new Date(build.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(build.id)}
                className="opacity-0 group-hover:opacity-100 text-d4-muted hover:text-cmp-bad transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
