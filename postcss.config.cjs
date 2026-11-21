// Tailwind 3 runs as a PostCSS plugin (replaces the @astrojs/tailwind integration,
// which does not support Astro 6+).
module.exports = {
     plugins: {
          tailwindcss: {},
          autoprefixer: {},
     },
}
