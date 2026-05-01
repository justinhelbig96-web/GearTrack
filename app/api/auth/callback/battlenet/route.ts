import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken, getBattleNetUser } from '@/lib/auth/battlenet'
import { prisma } from '@/lib/db/prisma'
import { createSessionToken, setSessionCookie } from '@/lib/auth/session'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/login?error=invalid`)
  }

  // Verify CSRF state
  const cookieStore = await cookies()
  const savedState  = cookieStore.get('oauth_state')?.value
  cookieStore.delete('oauth_state')

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/login?error=state`)
  }

  try {
    const accessToken = await exchangeCodeForToken(code)
    const bnUser      = await getBattleNetUser(accessToken)

    // Upsert user — Battle.net sub is the stable unique ID
    const user = await prisma.user.upsert({
      where:  { blizzardId: bnUser.sub },
      create: {
        blizzardId: bnUser.sub,
        battleTag:  bnUser.battletag,
        name:       bnUser.battletag.split('#')[0],
      },
      update: {
        battleTag: bnUser.battletag,
        name:      bnUser.battletag.split('#')[0],
      },
    })

    const token = await createSessionToken(user.id)
    await setSessionCookie(token)

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error('[BattleNet OAuth callback]', err)
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }
}
