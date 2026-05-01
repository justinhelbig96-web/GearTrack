'use client'

import { X, Star, Gem, Zap, Shield } from 'lucide-react'
import type { ParsedItem, ItemRarity, Affix, SlotComparison, AffixComparison } from '@/lib/types'
import { RARITY_COLORS, GEAR_SLOTS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ItemDetailPanelProps {
  item: ParsedItem | null
  imageUrl?: string
  itemId?: string
  ocrConfidence?: number
  slotComparison?: SlotComparison
  onClose: () => void
  onSave?: (updated: Partial<ParsedItem>) => void
}

function RarityBadge({ rarity }: { rarity?: ItemRarity }) {
  if (!rarity) return null
  return (
    <span className={cn('text-xs font-bold uppercase tracking-widest', RARITY_COLORS[rarity])}>
      {rarity}
    </span>
  )
}

function AffixRow({ affix, cmp }: { affix: Affix; cmp?: AffixComparison }) {
  const status = cmp?.status
  return (
    <li className={cn(
      'flex items-start gap-2 text-sm py-0.5 px-2 rounded',
      status === 'present' ? 'text-cmp-good' :
      status === 'missing' ? 'text-cmp-bad' :
      'text-d4-text'
    )}>
      <span className="mt-0.5 text-xs opacity-60">
        {status === 'present' ? '✓' : status === 'missing' ? '✗' : '·'}
      </span>
      <span className="flex-1">{affix.raw || affix.name}</span>
      {cmp?.hasGreater && (
        <Star className="h-3 w-3 text-d4-gold flex-shrink-0" />
      )}
    </li>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-cmp-good' : score >= 50 ? 'bg-cmp-partial' : 'bg-cmp-bad'
  return (
    <div className="w-full bg-d4-border rounded-full h-2 overflow-hidden">
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${score}%` }} />
    </div>
  )
}

export function ItemDetailPanel({
  item,
  imageUrl,
  itemId,
  ocrConfidence,
  slotComparison,
  onClose,
  onSave,
}: ItemDetailPanelProps) {
  return (
    <aside className="fixed right-0 top-0 h-full w-80 z-50 bg-d4-panel border-l border-d4-border shadow-panel overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-d4-border sticky top-0 bg-d4-panel z-10">
        <h2 className="text-d4-gold font-diablo text-sm uppercase tracking-wider">Item Details</h2>
        <button onClick={onClose} className="text-d4-muted hover:text-d4-text transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!item ? (
        <div className="flex-1 flex items-center justify-center text-d4-muted text-sm p-8 text-center">
          No item data yet.<br />Upload a screenshot to populate this panel.
        </div>
      ) : (
        <div className="flex-1 p-4 flex flex-col gap-4">
          {/* Item image */}
          {imageUrl && (
            <div className="rounded overflow-hidden border border-d4-border">
              <img src={imageUrl} alt={item.itemName ?? 'Item'} className="w-full object-contain max-h-40 bg-d4-bg" />
            </div>
          )}

          {/* Name & Rarity */}
          <div className="space-y-0.5">
            <RarityBadge rarity={item.rarity} />
            {item.itemName && (
              <h3 className="text-d4-text font-diablo text-base leading-tight">{item.itemName}</h3>
            )}
            {item.itemPower && (
              <p className="text-d4-muted text-xs">Item Power {item.itemPower}</p>
            )}
          </div>

          {/* Masterwork */}
          {item.masterworkLevel > 0 && (
            <div className="flex items-center gap-2 text-d4-gold text-xs">
              <Star className="h-3 w-3" />
              Masterwork Rank {item.masterworkLevel}
            </div>
          )}

          {/* Comparison score */}
          {slotComparison && (
            <div className="border border-d4-border/50 rounded p-3 bg-d4-surface space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-d4-muted text-xs">Build Match</span>
                <span className="font-mono text-sm font-bold"
                  style={{ color: slotComparison.score >= 80 ? '#22c55e' : slotComparison.score >= 50 ? '#eab308' : '#ef4444' }}>
                  {slotComparison.score}%
                </span>
              </div>
              <ScoreBar score={slotComparison.score} />
              {slotComparison.missingAffixes.length > 0 && (
                <div>
                  <p className="text-cmp-bad text-xs mb-1">Missing affixes:</p>
                  {slotComparison.missingAffixes.map(a => (
                    <p key={a} className="text-cmp-bad text-xs ml-2">• {a}</p>
                  ))}
                </div>
              )}
              {slotComparison.missingAspect && (
                <p className="text-cmp-partial text-xs">Missing aspect: {slotComparison.missingAspect}</p>
              )}
            </div>
          )}

          {/* Affixes */}
          {item.affixes.length > 0 && (
            <div>
              <h4 className="text-d4-muted text-xs uppercase tracking-widest mb-1">Affixes</h4>
              <ul className="space-y-0.5">
                {item.affixes.map((affix, i) => {
                  const cmp = slotComparison?.affixComparisons.find(
                    ac => ac.name.toLowerCase().includes(affix.name.toLowerCase()) ||
                          affix.name.toLowerCase().includes(ac.name.toLowerCase())
                  )
                  return <AffixRow key={i} affix={affix} cmp={cmp} />
                })}
              </ul>
            </div>
          )}

          {/* Aspect */}
          {item.aspect && (
            <div className="border border-rarity-legendary/30 rounded p-3 bg-rarity-legendary/5">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="h-3 w-3 text-rarity-legendary" />
                <h4 className="text-rarity-legendary text-xs font-bold uppercase tracking-wider">Aspect</h4>
              </div>
              <p className="text-d4-text text-xs font-bold">{item.aspect.name}</p>
              {item.aspect.effect && (
                <p className="text-d4-text text-xs mt-1 opacity-80">{item.aspect.effect}</p>
              )}
            </div>
          )}

          {/* Tempering */}
          {item.temperingAffixes.length > 0 && (
            <div>
              <h4 className="text-d4-muted text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
                <Shield className="h-3 w-3" /> Tempering
              </h4>
              <ul className="space-y-0.5">
                {item.temperingAffixes.map((a, i) => (
                  <li key={i} className="text-d4-text text-xs px-2">· {a.name || a.raw}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Gem / Rune */}
          {(item.gem || item.rune) && (
            <div className="flex items-center gap-2 text-xs text-d4-text">
              <Gem className="h-3 w-3 text-d4-gold" />
              {item.gem ?? item.rune}
            </div>
          )}

          {/* OCR Confidence */}
          {ocrConfidence !== undefined && (
            <div className="mt-auto pt-4 border-t border-d4-border/50">
              <div className="flex items-center justify-between text-xs text-d4-muted">
                <span>OCR Confidence</span>
                <span className="font-mono">{Math.round(ocrConfidence * 100)}%</span>
              </div>
              <div className="mt-1 h-1 w-full bg-d4-border rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', ocrConfidence >= 0.7 ? 'bg-cmp-good' : 'bg-cmp-partial')}
                  style={{ width: `${ocrConfidence * 100}%` }}
                />
              </div>
              {ocrConfidence < 0.7 && (
                <p className="text-cmp-partial text-xs mt-1">Low confidence — please review parsed values</p>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
