import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Diablo 4 palette
        'd4-bg':        '#0a0a0f',
        'd4-surface':   '#12111a',
        'd4-panel':     '#1c1a26',
        'd4-border':    '#3d2e1e',
        'd4-gold':      '#c8a84b',
        'd4-orange':    '#c84b1a',
        'd4-red':       '#8b1a1a',
        'd4-text':      '#c5b89a',
        'd4-muted':     '#6b5e4a',
        // Rarity
        'rarity-legendary': '#c86400',
        'rarity-unique':    '#d4af37',
        'rarity-rare':      '#ffff00',
        'rarity-magic':     '#5588ff',
        'rarity-normal':    '#c5b89a',
        // Comparison
        'cmp-good':    '#22c55e',
        'cmp-bad':     '#ef4444',
        'cmp-partial': '#eab308',
      },
      fontFamily: {
        diablo: ['Georgia', 'serif'],
      },
      backgroundImage: {
        'slot-empty':    'radial-gradient(ellipse at center, #1c1a26 0%, #0a0a0f 100%)',
        'slot-filled':   'radial-gradient(ellipse at center, #2a1e0f 0%, #12111a 100%)',
        'panel-bg':      'linear-gradient(180deg, #1c1a26 0%, #12111a 100%)',
      },
      boxShadow: {
        'slot':          '0 0 12px rgba(200,100,0,0.3), inset 0 0 8px rgba(0,0,0,0.8)',
        'slot-hover':    '0 0 20px rgba(200,100,0,0.6), inset 0 0 8px rgba(0,0,0,0.8)',
        'panel':         '0 4px 32px rgba(0,0,0,0.8)',
        'rarity-legendary': '0 0 16px rgba(200,100,0,0.5)',
        'rarity-unique':    '0 0 16px rgba(212,175,55,0.5)',
      }
    },
  },
  plugins: [],
}

export default config
