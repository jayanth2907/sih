/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#06110F',
          secondary: '#081815',
          surface: '#0D211C',
          card: '#102821',
          'card-hover': '#15332b',
          border: '#1D3A32',
          'border-light': '#2a5348',
          forest: '#0B3D32',
          emerald: '#10B981',
          teal: '#14B8A6',
          cyan: '#06B6D4',
        },
        status: {
          critical: '#F43F5E',
          danger: '#EF4444',
          warning: '#F59E0B',
          info: '#38BDF8',
          success: '#22C55E',
          muted: '#64748B',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          accent: '#10B981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'subtle': '12px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glow-teal': '0 0 25px -5px rgba(20, 184, 166, 0.25)',
        'glow-critical': '0 0 25px -5px rgba(244, 63, 94, 0.3)',
      },
    },
  },
  plugins: [],
}
