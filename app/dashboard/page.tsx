import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import GearScreenClient from '@/components/GearScreenClient'
import type { GearSlot, ParsedItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

const SLOT_MAPPING: [GearSlot, string][] = [
  ['HELMET',    'helmet'],
  ['CHEST',     'chest'],
  ['GLOVES',    'gloves'],
  ['PANTS',     'pants'],
  ['BOOTS',     'boots'],
  ['AMULET',    'amulet'],
  ['RING1',     'ring1'],
  ['RING2',     'ring2'],
  ['MAIN_HAND', 'mainHand'],
  ['OFF_HAND',  'offHand'],
]

async function getOrCreateActiveProfile(userId: string) {
  let profile = await prisma.gearProfile.findFirst({
    where: { userId, isActive: true },
    include: {
      helmet: true, chest: true, gloves: true, pants: true, boots: true,
      amulet: true, ring1: true, ring2: true, mainHand: true, offHand: true,
    },
  })
  if (!profile) {
    profile = await prisma.gearProfile.create({
      data: { userId, name: 'My Character', isActive: true },
      include: {
        helmet: true, chest: true, gloves: true, pants: true, boots: true,
        amulet: true, ring1: true, ring2: true, mainHand: true, offHand: true,
      },
    })
  }
  return profile
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getOrCreateActiveProfile(user.id)

  // Build inventory from DB items
  type DbItem = {
    id: string
    imageUrl: string | null
    ocrConfidence: number | null
    itemName: string | null
    itemPower: number | null
    rarity: string | null
    affixes: unknown
    greaterAffixes: unknown
    aspect: unknown
    temperingAffixes: unknown
    masterworkLevel: number
    gem: string | null
    rune: string | null
  }

  const initialInventory: Partial<Record<GearSlot, { itemId: string; imageUrl?: string; parsedItem: ParsedItem }>> = {}

  for (const [slot, field] of SLOT_MAPPING) {
    const dbItem = (profile as Record<string, unknown>)[field] as DbItem | null
    if (dbItem) {
      initialInventory[slot] = {
        itemId:   dbItem.id,
        imageUrl: dbItem.imageUrl ?? undefined,
        parsedItem: {
          slot,
          itemName:         dbItem.itemName  ?? undefined,
          itemPower:        dbItem.itemPower ?? undefined,
          rarity:           dbItem.rarity as ParsedItem['rarity'] ?? undefined,
          affixes:          (dbItem.affixes as ParsedItem['affixes']) ?? [],
          greaterAffixes:   (dbItem.greaterAffixes as string[]) ?? [],
          aspect:           dbItem.aspect as ParsedItem['aspect'] ?? undefined,
          temperingAffixes: (dbItem.temperingAffixes as ParsedItem['temperingAffixes']) ?? [],
          masterworkLevel:  dbItem.masterworkLevel,
          gem:              dbItem.gem  ?? undefined,
          rune:             dbItem.rune ?? undefined,
        },
      }
    }
  }

  return (
    <GearScreenClient
      profileId={profile.id}
      battleTag={user.battleTag ?? 'Nephalem'}
      name={user.name}
      initialInventory={initialInventory}
    />
  )
}
