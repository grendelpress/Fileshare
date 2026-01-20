/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e6f7f7',
          100: '#b3e6e6',
          200: '#80d5d5',
          300: '#4dc4c4',
          400: '#1ab3b3',
          500: '#0d9b9b',
          600: '#0a7a7a',
          700: '#085858',
          800: '#053737',
          900: '#021515',
        },
        navy: {
          50: '#e8eef5',
          100: '#c1d3e5',
          200: '#9ab8d5',
          300: '#739dc5',
          400: '#4c82b5',
          500: '#2d5f8d',
          600: '#244b6f',
          700: '#1a3651',
          800: '#112233',
          900: '#070d15',
        },
      },
    },
  },
  plugins: [],
};
