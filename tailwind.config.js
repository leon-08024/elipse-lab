/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        os: ['"Courier Prime"', 'Chicago', 'monospace'],
        body: ['Verdana', 'Geneva', 'sans-serif'],
      },
      colors: {
        link: '#3685c5', // links
      },
    },
  },
  plugins: [],
};
