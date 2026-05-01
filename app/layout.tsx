import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GearGap — Diablo 4 Gear Companion',
  description: 'Upload screenshots, parse your gear, compare to your target build.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-d4-bg text-d4-text antialiased">
        {children}
      </body>
    </html>
  )
}
