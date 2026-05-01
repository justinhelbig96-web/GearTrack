import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  denied:  'Login wurde abgebrochen.',
  invalid: 'Ungültige OAuth-Anfrage.',
  state:   'Sicherheitsfehler — bitte erneut versuchen.',
  oauth:   'Battle.net Login fehlgeschlagen — bitte erneut versuchen.',
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? 'Unbekannter Fehler.') : null

  return (
    <div className="min-h-screen bg-d4-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-d4-gold text-5xl select-none">⚔</span>
          <h1 className="text-d4-gold font-diablo text-3xl tracking-widest mt-3">GearGap</h1>
          <p className="text-d4-muted text-sm mt-1">Diablo 4 Gear Companion</p>
        </div>

        {/* Card */}
        <div className="bg-d4-panel border border-d4-border rounded-lg p-8 shadow-panel space-y-6">
          <div className="text-center">
            <h2 className="text-d4-text font-diablo text-base tracking-widest uppercase">
              Anmelden
            </h2>
            <p className="text-d4-muted text-xs mt-1">
              Melde dich mit deinem Battle.net Account an
            </p>
          </div>

          {/* Ornament */}
          <div className="d4-divider" />

          {/* Error */}
          {errorMsg && (
            <p className="text-cmp-bad text-xs text-center bg-cmp-bad/10 border border-cmp-bad/30 rounded px-3 py-2">
              {errorMsg}
            </p>
          )}

          {/* Battle.net Button */}
          <Link
            href="/api/auth/battlenet"
            className="flex items-center justify-center gap-3 w-full rounded-lg py-3 px-4 font-bold text-sm transition-all duration-200
              bg-[#0070DD] hover:bg-[#0086ff] text-white shadow-lg hover:shadow-[0_0_20px_rgba(0,112,221,0.5)]"
          >
            {/* Battle.net Logo SVG */}
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current flex-shrink-0" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 7.168c1.232 1.233 1.93 2.74 2.07 4.3H17.48a5.96 5.96 0 0 0-1.594-3.488l1.676-1.676a.378.378 0 0 0 0-.534.378.378 0 0 0-.534 0l-1.676 1.676A5.96 5.96 0 0 0 11.864 6.5V4.356a8.16 8.16 0 0 1 5.698 2.812zM11.136 4.356V6.5a5.96 5.96 0 0 0-3.488 1.594L5.972 6.418a.377.377 0 0 0-.534 0 .378.378 0 0 0 0 .534l1.676 1.676A5.96 5.96 0 0 0 6.52 12.232H4.368a8.144 8.144 0 0 1 6.768-7.876zM4.368 12.768H6.52a5.96 5.96 0 0 0 1.594 3.488L6.438 17.932a.378.378 0 0 0 .534.534l1.676-1.676A5.96 5.96 0 0 0 12.136 18.5v2.144a8.144 8.144 0 0 1-7.768-7.876zm8.496 7.876V18.5a5.96 5.96 0 0 0 3.488-1.594l1.676 1.676a.378.378 0 0 0 .534-.534l-1.676-1.676A5.96 5.96 0 0 0 18.48 12.768h2.152a8.144 8.144 0 0 1-7.768 7.876z"/>
            </svg>
            Mit Battle.net anmelden
          </Link>

          <p className="text-d4-muted text-xs text-center">
            Deine Battle.net Zugangsdaten werden nicht gespeichert.<br />
            Nur dein BattleTag wird übertragen.
          </p>
        </div>
      </div>
    </div>
  )
}
