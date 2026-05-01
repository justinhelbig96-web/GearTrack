import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { compareGearToBuild } from '@/lib/comparison/engine'
import type { GearSlot, ParsedItem, BuildSlotData } from '@/lib/types'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { profileId, buildId } = body

  if (!profileId || !buildId) {
    return NextResponse.json({ error: 'profileId and buildId are required' }, { status: 400 })
  }

  // Load profile with items
  const profile = await prisma.gearProfile.findFirst({
    where: { id: profileId, userId: user.id },
    include: {
      helmet: true, chest: true, gloves: true, pants: true, boots: true,
      amulet: true, ring1: true, ring2: true, mainHand: true, offHand: true,
    },
  })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Load build
  const build = await prisma.build.findFirst({ where: { id: buildId, userId: user.id } })
  if (!build) return NextResponse.json({ error: 'Build not found' }, { status: 404 })

  // Map profile items to slot → ParsedItem
  const slotItemMap: Partial<Record<GearSlot, ParsedItem>> = {}
  const slotDbMap: Record<string, typeof profile.helmet> = {
    HELMET: profile.helmet, CHEST: profile.chest, GLOVES: profile.gloves,
    PANTS: profile.pants, BOOTS: profile.boots, AMULET: profile.amulet,
    RING1: profile.ring1, RING2: profile.ring2,
    MAIN_HAND: profile.mainHand, OFF_HAND: profile.offHand,
  }

  for (const [slot, dbItem] of Object.entries(slotDbMap) as [GearSlot, typeof profile.helmet][]) {
    if (!dbItem) continue
    slotItemMap[slot] = {
      slot:            dbItem.slot as GearSlot,
      itemName:        dbItem.itemName ?? undefined,
      itemPower:       dbItem.itemPower ?? undefined,
      rarity:          dbItem.rarity as ParsedItem['rarity'] ?? undefined,
      affixes:         (dbItem.affixes as unknown as ParsedItem['affixes']) ?? [],
      greaterAffixes:  (dbItem.greaterAffixes as unknown as string[]) ?? [],
      aspect:          (dbItem.aspect as unknown) as ParsedItem['aspect'] ?? undefined,
      temperingAffixes: (dbItem.temperingAffixes as unknown as ParsedItem['temperingAffixes']) ?? [],
      masterworkLevel: dbItem.masterworkLevel,
      gem:             dbItem.gem ?? undefined,
      rune:            dbItem.rune ?? undefined,
    }
  }

  const buildSlots = build.slots as BuildSlotData

  const comparison = compareGearToBuild(slotItemMap, buildSlots)

  return NextResponse.json({ comparison })
}
