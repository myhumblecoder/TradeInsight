/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#A7C7E7',
          dark: '#4A90E2',
        },
        secondary: {
          light: '#B5D8A8',
          dark: '#7FB069',
        },
      },
    },
  },
  plugins: [],
}
