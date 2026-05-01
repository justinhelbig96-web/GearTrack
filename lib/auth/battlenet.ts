/**
 * Battle.net OAuth 2.0 helpers
 * Docs: https://develop.battle.net/documentation/guides/using-oauth
 */

const AUTH_URL     = 'https://oauth.battle.net/authorize'
const TOKEN_URL    = 'https://oauth.battle.net/token'
const USERINFO_URL = 'https://oauth.battle.net/userinfo'

export function getBattleNetAuthUrl(state: string): string {
  if (!process.env.BATTLENET_CLIENT_ID || !process.env.BATTLENET_REDIRECT_URI) {
    throw new Error('BATTLENET_CLIENT_ID and BATTLENET_REDIRECT_URI must be set')
  }

  const params = new URLSearchParams({
    client_id:     process.env.BATTLENET_CLIENT_ID,
    redirect_uri:  process.env.BATTLENET_REDIRECT_URI,
    response_type: 'code',
    scope:         'openid',
    state,
  })

  return `${AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.BATTLENET_CLIENT_ID}:${process.env.BATTLENET_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:  `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: process.env.BATTLENET_REDIRECT_URI!,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.access_token as string
}

export interface BattleNetUser {
  sub:       string   // unique account ID
  battletag: string   // e.g. "Player#1234"
  id?:       number   // older field, same as sub
}

export async function getBattleNetUser(accessToken: string): Promise<BattleNetUser> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Userinfo fetch failed (${res.status})`)
  }

  return res.json() as Promise<BattleNetUser>
}
