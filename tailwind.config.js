/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: { float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } } },
      animation: { float: "float 4s ease-in-out infinite" },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      colors: {
        primary: '#6366f1',
        primaryHover: '#4f46e5',
        secondary: '#00c853',
        darkBg: '#141824',
        darkCard: '#1e2435',
        tossBg: '#f7f8fc',
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(0, 0, 0, 0.04)',
        'apple': '0 2px 12px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.35)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
