import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/profiles  — list user's gear profiles
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profiles = await prisma.gearProfile.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      helmet: true, chest: true, gloves: true, pants: true, boots: true,
      amulet: true, ring1: true, ring2: true, mainHand: true, offHand: true,
    },
  })

  return NextResponse.json({ profiles })
}

// POST /api/profiles  — create a new profile
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, class: heroClass } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // If this is the first profile, mark it active
  const existingCount = await prisma.gearProfile.count({ where: { userId: user.id } })

  const profile = await prisma.gearProfile.create({
    data: {
      userId: user.id,
      name,
      class: heroClass ?? null,
      isActive: existingCount === 0,
    },
  })

  return NextResponse.json({ profile })
}
