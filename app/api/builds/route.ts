import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const builds = await prisma.build.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ builds })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, class: heroClass, rawText, slots, sourceUrl } = body

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const build = await prisma.build.create({
    data: {
      userId: user.id,
      name,
      class:     heroClass ?? null,
      rawText:   rawText ?? null,
      slots:     slots ?? {},
      sourceUrl: sourceUrl ?? null,
    },
  })

  return NextResponse.json({ build })
}
