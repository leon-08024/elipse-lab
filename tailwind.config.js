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
        bezel: '#282725',
        signal: '#f37725', // status
        link: '#3685c5', // links
      },
    },
  },
  plugins: [],
};
