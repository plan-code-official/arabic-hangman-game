/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#121224',
          card: '#1c1c33',
          border: '#2a2a4a',
          accent: '#ff7828',
          gold: '#f59e0b',
          correct: '#10b981',
          correctDark: '#064e3b',
          wrong: '#ef4444',
          wrongDark: '#7f1d1d',
          key: '#262642',
          keyHover: '#333357',
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'shake': 'shake 0.4s ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'bounce-short': 'bounceShort 0.5s ease-in-out',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(255, 120, 40, 0.6))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(255, 120, 40, 0.9))' },
        },
        bounceShort: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
