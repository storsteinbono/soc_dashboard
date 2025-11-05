/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0e27',
        surface: '#1a1f3a',
        surfaceLight: '#2a3f5f',
        primary: '#4fc3f7',
        primaryDark: '#2196f3',
        text: '#e0e0e0',
        textMuted: '#7a8ca0',
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
      },
    },
  },
  plugins: [],
}
