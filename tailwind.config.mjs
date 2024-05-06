/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        background: '#090C1A',
        primary: '#2D8CFC',
        textGray: '#979BA4',
      },
    },
  },
  plugins: [],
}
