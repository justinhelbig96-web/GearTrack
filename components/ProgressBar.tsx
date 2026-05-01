'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number       // 0–100
  label?: string
  showValue?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

function getColor(value: number) {
  if (value >= 80) return 'bg-cmp-good'
  if (value >= 50) return 'bg-cmp-partial'
  return 'bg-cmp-bad'
}

function getTextColor(value: number) {
  if (value >= 80) return 'text-cmp-good'
  if (value >= 50) return 'text-cmp-partial'
  return 'text-cmp-bad'
}

const HEIGHT: Record<string, string> = { sm: 'h-1', md: 'h-2', lg: 'h-3' }

export function ProgressBar({ value, label, showValue = true, className, size = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-d4-muted">{label}</span>}
          {showValue && (
            <span className={cn('text-xs font-mono font-bold', getTextColor(clamped))}>
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-d4-border rounded-full overflow-hidden', HEIGHT[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', getColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
