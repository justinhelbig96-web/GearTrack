import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Registration disabled. Use Battle.net OAuth at /api/auth/battlenet' },
    { status: 410 }
  )
}
