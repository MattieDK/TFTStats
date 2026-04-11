/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tft: {
          gold:    '#C89B3C',
          'gold-light': '#E8C76A',
          dark:    '#0a0a14',
          card:    '#13131f',
          border:  '#2a2a3e',
          muted:   '#6b7280',
        },
        cost: {
          1: '#94a3b8',
          2: '#22c55e',
          3: '#3b82f6',
          4: '#a855f7',
          5: '#C89B3C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
