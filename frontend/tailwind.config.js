/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#102a43',
        canvas: '#f5f7fb',
        accent: '#2563eb',
      },
    },
  },
  plugins: [],
};
