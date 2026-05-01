import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { NavBar } from '@/components/NavBar'
import { ArmoryClient } from '@/components/ArmoryClient'
import type { GearSlot, ParsedItem, SlotComparison } from '@/lib/types'
import type { ArmorySlotData } from '@/components/ArmorySlot'

async function getOrCreateActiveProfile(userId: string) {
  let profile = await prisma.gearProfile.findFirst({
    where: { userId, isActive: true },
    include: {
      helmet: true, chest: true, gloves: true, pants: true, boots: true,
      amulet: true, ring1: true, ring2: true, mainHand: true, offHand: true,
    },
  })

  if (!profile) {
    // Create default profile
    const created = await prisma.gearProfile.create({
      data: { userId, name: 'My Character', isActive: true },
      include: {
        helmet: true, chest: true, gloves: true, pants: true, boots: true,
        amulet: true, ring1: true, ring2: true, mainHand: true, offHand: true,
      },
    })
    profile = created
  }

  return profile
}

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

export default async function ArmoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getOrCreateActiveProfile(user.id)

  // Build inventory state from DB items
  const initialInventory: Partial<Record<GearSlot, ArmorySlotData>> = {}

  for (const [slot, field] of SLOT_MAPPING) {
    const dbItem = (profile as Record<string, unknown>)[field] as {
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
    } | null

    if (dbItem) {
      const parsedItem: ParsedItem = {
        slot,
        itemName:        dbItem.itemName  ?? undefined,
        itemPower:       dbItem.itemPower ?? undefined,
        rarity:          dbItem.rarity as ParsedItem['rarity'] ?? undefined,
        affixes:         (dbItem.affixes as ParsedItem['affixes']) ?? [],
        greaterAffixes:  (dbItem.greaterAffixes as string[]) ?? [],
        aspect:          dbItem.aspect as ParsedItem['aspect'] ?? undefined,
        temperingAffixes: (dbItem.temperingAffixes as ParsedItem['temperingAffixes']) ?? [],
        masterworkLevel: dbItem.masterworkLevel,
        gem:             dbItem.gem  ?? undefined,
        rune:            dbItem.rune ?? undefined,
      }

      initialInventory[slot] = {
        state: 'parsed',
        imageUrl:      dbItem.imageUrl ?? undefined,
        parsedItem,
        itemId:        dbItem.id,
        ocrConfidence: dbItem.ocrConfidence ?? undefined,
      }
    }
  }

  return (
    <div className="min-h-screen bg-d4-bg flex">
      <NavBar />
      <main className="flex-1 ml-16 lg:ml-52 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-d4-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-d4-gold font-diablo text-xl tracking-widest">Armory</h1>
            <p className="text-d4-muted text-xs mt-0.5">
              {profile.name} {profile.class ? `— ${profile.class}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-d4-muted text-xs">
              Upload screenshots to populate your gear
            </span>
          </div>
        </header>

        {/* Armory grid */}
        <ArmoryClient
          profileId={profile.id}
          initialInventory={initialInventory}
          comparisons={{}}
        />
      </main>
    </div>
  )
}
