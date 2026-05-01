/**
 * Comparison Engine
 * Compares a player's GearProfile against a target Build.
 */

import type {
  ParsedItem,
  BuildSlotData,
  BuildSlotRequirement,
  BuildComparison,
  SlotComparison,
  AffixComparison,
  GearSlot,
} from '@/lib/types'

// Fuzzy match: returns true if `a` is a substring of `b` or vice versa (case-insensitive)
function affixNameMatch(a: string, b: string): boolean {
  const an = a.toLowerCase().replace(/[^a-z0-9]/g, '')
  const bn = b.toLowerCase().replace(/[^a-z0-9]/g, '')
  return an === bn || an.includes(bn) || bn.includes(an)
}

function compareSlot(
  item: ParsedItem,
  req: BuildSlotRequirement
): SlotComparison {
  const affixComparisons: AffixComparison[] = []
  const missingAffixes: string[] = []
  const wrongAffixes: string[] = []
  const suggestions: string[] = []

  const itemAffixNames = [
    ...item.affixes.map(a => a.name),
    ...item.temperingAffixes.map(a => a.name),
  ]

  let matched = 0

  for (const reqAffix of req.affixes) {
    const found = itemAffixNames.some(ia => affixNameMatch(ia, reqAffix.name))

    if (found) {
      const hasGreater = item.greaterAffixes.some(ga => affixNameMatch(ga, reqAffix.name))
      affixComparisons.push({
        name: reqAffix.name,
        status: 'present',
        required: reqAffix.required,
        hasGreater,
      })
      matched++
    } else {
      affixComparisons.push({
        name: reqAffix.name,
        status: 'missing',
        required: reqAffix.required,
      })
      if (reqAffix.required) {
        missingAffixes.push(reqAffix.name)
        suggestions.push(`Upgrade to an item with ${reqAffix.name}`)
      }
    }
  }

  // Check wrong affixes: item affixes NOT in the build requirement
  for (const ia of item.affixes) {
    const isWanted = req.affixes.some(ra => affixNameMatch(ra.name, ia.name))
    if (!isWanted && req.affixes.length > 0) {
      wrongAffixes.push(ia.name)
    }
  }

  // Aspect comparison
  let missingAspect: string | undefined
  if (req.aspect) {
    const hasAspect = item.aspect
      ? affixNameMatch(item.aspect.name, req.aspect)
      : false
    if (!hasAspect) {
      missingAspect = req.aspect
      suggestions.push(`Apply aspect: ${req.aspect}`)
    }
  }

  const totalRequired = req.affixes.filter(a => a.required).length
  const requiredMatched = req.affixes.filter(a => {
    if (!a.required) return false
    return itemAffixNames.some(ia => affixNameMatch(ia, a.name))
  }).length

  // Score: weighted by required affixes (80%) + aspect (20% if present)
  let score: number
  if (totalRequired === 0) {
    score = 100
  } else {
    score = Math.round((requiredMatched / totalRequired) * (req.aspect ? 80 : 100))
    if (req.aspect && !missingAspect) score += 20
  }

  return {
    slot: req.slot,
    score: Math.min(100, Math.max(0, score)),
    affixComparisons,
    missingAffixes,
    wrongAffixes,
    missingAspect,
    suggestions,
  }
}

export function compareGearToBuild(
  items: Partial<Record<GearSlot, ParsedItem>>,
  build: BuildSlotData
): BuildComparison {
  const slotResults: Partial<Record<GearSlot, SlotComparison>> = {}
  const scores: number[] = []

  for (const [slotKey, req] of Object.entries(build) as [GearSlot, BuildSlotRequirement][]) {
    const item = items[slotKey]
    if (!item) {
      // Slot is empty — 0% score
      slotResults[slotKey] = {
        slot: slotKey,
        score: 0,
        affixComparisons: req.affixes.map(a => ({
          name: a.name,
          status: 'missing',
          required: a.required,
        })),
        missingAffixes: req.affixes.filter(a => a.required).map(a => a.name),
        wrongAffixes: [],
        missingAspect: req.aspect,
        suggestions: ['No item equipped in this slot'],
      }
      scores.push(0)
      continue
    }

    const result = compareSlot(item, req)
    slotResults[slotKey] = result
    scores.push(result.score)
  }

  const totalScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

  return { totalScore, slotResults }
}
