/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          950: '#05060f',
          900: '#0a0c1d',
          800: '#11142b',
          700: '#1b1f3d',
        },
        focus: '#f472b6', // focos
        major: '#22d3ee', // eixo maior / a
        minor: '#a78bfa', // eixo menor / b
        dist: '#facc15', // distância focal / c
        curve: '#34d399', // a curva
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(34,211,238,0.45)',
      },
    },
  },
  plugins: [],
};
