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
        primary: '#3182f6', // Toss Blue
        primaryHover: '#1b64da',
        secondary: '#00c853',
        darkBg: '#000000', // Apple Pure Black
        darkCard: '#1c1c1e', // Apple Dark Card
        tossBg: '#f2f4f6', // Apple Light Gray Background
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(0, 0, 0, 0.04)',
        'apple': '0 2px 12px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(49, 130, 246, 0.5)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
