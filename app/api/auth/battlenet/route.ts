import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getBattleNetAuthUrl } from '@/lib/auth/battlenet'
import { randomUUID } from 'crypto'

export async function GET() {
  // Generate CSRF state token
  const state = randomUUID()

  // Store state in short-lived cookie
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600, // 10 minutes
    path:     '/',
  })

  const authUrl = getBattleNetAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
