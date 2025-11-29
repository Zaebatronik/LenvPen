/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lenvpen-dark': '#0f0f0f',
        'lenvpen-bg': '#1a1a1a',
        'lenvpen-card': '#2a2a2a',
        'lenvpen-red': '#ff4444',
        'lenvpen-orange': '#ff8833',
        'lenvpen-yellow': '#ffcc00',
        'lenvpen-green': '#44ff88',
        'lenvpen-text': '#e5e5e5',
        'lenvpen-muted': '#999999'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
