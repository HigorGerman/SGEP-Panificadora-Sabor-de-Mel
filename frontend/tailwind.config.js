/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // Adicione esta linha se sua pasta components estiver dentro de app:
    "./src/app/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'padaria-vinho': '#5B0A1A', 
        'padaria-creme': '#FDFCF5',
      },
    },
  },
  plugins: [],
}