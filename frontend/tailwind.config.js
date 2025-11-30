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
        'lenvpen-bg': '#121212',
        'lenvpen-card': '#1e1e1e',
        'lenvpen-border': '#2a2a2a',
        'lenvpen-red': '#ef4444',
        'lenvpen-orange': '#f97316',
        'lenvpen-yellow': '#eab308',
        'lenvpen-green': '#22c55e',
        'lenvpen-blue': '#3b82f6',
        'lenvpen-text': '#f5f5f5',
        'lenvpen-muted': '#737373',
        'lenvpen-accent': '#f97316'
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
