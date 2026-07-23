/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        telegram: {
          darkBg: '#0e1621',
          darkSidebar: '#17212b',
          darkCard: '#242f3d',
          darkBubble: '#2b5278',
          darkReceiveBubble: '#182533',
          darkHover: '#202b36',
          darkText: '#f5f5f5',
          darkMuted: '#7f91a4',
          accent: '#5288c1',
          accentHover: '#4478b0',
          teacherBadge: '#10b981',
          adminBadge: '#ef4444',
          studentBadge: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
