/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1ED',
          100: '#FFE4DB',
          200: '#FFC7B5',
          300: '#FFA088',
          400: '#FF7A5C',
          500: '#EF4523',
          600: '#EF4523',
          700: '#C53414',
          800: '#9A2810',
          900: '#6B1B0A',
        },
        ink: '#0A0A0A',
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        brand: '14px',
      },
    },
  },
  plugins: [],
};
