/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      colors: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
        secondary: '#10b981',
        darkBg: '#000000',
        darkCard: '#000000'
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.5)',
        'glimmer-shadow': '0 20px 40px -10px rgba(0,0,0,1)',
      }
    },
  },
  plugins: [],
}
