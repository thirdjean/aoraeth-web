/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aoraeth: {
          orange: '#EA580C',
          stone: '#78716C',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'], // Matching the "Warm Editorial" vibe
      }
    },
  },
  plugins: [],
}
