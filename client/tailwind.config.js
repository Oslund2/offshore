/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gwoe: {
          bg: '#0a0e17',
          card: '#111827',
          border: '#1e293b',
          accent: '#3b82f6',
          'accent-glow': '#60a5fa',
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          text: '#e2e8f0',
          muted: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
