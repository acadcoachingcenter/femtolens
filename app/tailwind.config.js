/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#080B0E',
          900: '#0B1116',
          800: '#111922',
          700: '#182430',
          600: '#22303D',
          500: '#3A4C5A',
        },
        paper: {
          50: '#F6F5F0',
          100: '#EFEDE5',
        },
        lens: {
          400: '#5FD9CF',
          500: '#3CC2B6',
          600: '#2A9E93',
        },
        signal: {
          amber: '#E3A345',
          coral: '#E1684F',
          violet: '#8C87E0',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'grid-fine': 'linear-gradient(rgba(95,217,207,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(95,217,207,0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
