/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1F2A24',
        paper: '#FBFAF7',
        herb: {
          50: '#EEF4F0',
          200: '#B9D3C2',
          500: '#2F6B4F',
          600: '#255840',
          700: '#1C4531',
        },
        ochre: {
          400: '#E0A458',
          500: '#CC8E3F',
        },
        brick: '#C1462F',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
