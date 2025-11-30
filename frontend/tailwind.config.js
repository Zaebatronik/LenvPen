/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lenvpen-dark': '#0a0a0a',
        'lenvpen-bg': '#0f0f0f',
        'lenvpen-card': '#1a1a2e',
        'lenvpen-border': '#16213e',
        'lenvpen-red': '#e94560',
        'lenvpen-orange': '#0f3460',
        'lenvpen-yellow': '#eab308',
        'lenvpen-green': '#22c55e',
        'lenvpen-blue': '#3b82f6',
        'lenvpen-text': '#f5f5f5',
        'lenvpen-muted': '#737373',
        'lenvpen-accent': '#00adb5'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
