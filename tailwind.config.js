/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          light: '#FDFBF7',
          DEFAULT: '#F5F5DC',
          dark: '#E8E8C8',
        },
        pista: {
          light: '#E2F1E1',
          DEFAULT: '#B6C4B6',
          dark: '#799351',
          deep: '#5F6F52',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
