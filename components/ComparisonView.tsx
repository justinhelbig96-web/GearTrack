'use client'

import { type BuildComparison, GEAR_SLOTS } from '@/lib/types'
import { ProgressBar } from '@/components/ProgressBar'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ComparisonViewProps {
  comparison: BuildComparison
}

export function ComparisonView({ comparison }: ComparisonViewProps) {
  const slotMetas = GEAR_SLOTS

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="bg-d4-panel border border-d4-border rounded-lg p-4">
        <h3 className="text-d4-gold font-diablo text-sm uppercase tracking-widest mb-3">
          Overall Build Score
        </h3>
        <ProgressBar value={comparison.totalScore} size="lg" />
      </div>

      {/* Per-slot results */}
      <div className="space-y-2">
        {slotMetas.map(({ slot, label }) => {
          const result = comparison.slotResults[slot]
          if (!result) return null

          return (
            <div key={slot} className="bg-d4-panel border border-d4-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-d4-text text-sm font-diablo">{label}</span>
                <span className={cn(
                  'text-sm font-bold font-mono',
                  result.score >= 80 ? 'text-cmp-good' :
                  result.score >= 50 ? 'text-cmp-partial' : 'text-cmp-bad'
                )}>
                  {result.score}%
                </span>
              </div>

              <ProgressBar value={result.score} showValue={false} size="sm" className="mb-2" />

              {/* Affix breakdown */}
              {result.affixComparisons.length > 0 && (
                <ul className="space-y-0.5 mt-2">
                  {result.affixComparisons.map((affix, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      {affix.status === 'present' ? (
                        <CheckCircle className="h-3 w-3 text-cmp-good flex-shrink-0" />
                      ) : affix.status === 'missing' ? (
                        <XCircle className="h-3 w-3 text-cmp-bad flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-cmp-partial flex-shrink-0" />
                      )}
                      <span className={cn(
                        affix.status === 'present' ? 'text-cmp-good' :
                        affix.status === 'missing' ? 'text-cmp-bad' : 'text-cmp-partial'
                      )}>
                        {affix.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Missing aspect */}
              {result.missingAspect && (
                <p className="text-cmp-partial text-xs mt-1">
                  Missing aspect: {result.missingAspect}
                </p>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-d4-border/50">
                  {result.suggestions.map((s, i) => (
                    <p key={i} className="text-d4-muted text-xs">→ {s}</p>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
