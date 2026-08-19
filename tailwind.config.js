/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c90e7',
          600: '#0171c6',
          700: '#025aa0',
          800: '#064c84',
          900: '#0b406e',
          950: '#072849',
        },
        thai: {
          gold: '#c59b27',
          emerald: '#059669',
          crimson: '#dc2626',
        }
      },
      fontFamily: {
        sans: [
          'Sarabun',
          'Prompt',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
