/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "node_modules/tailvue/dist/tailvue.es.js",
    `components/**/*.{vue,js}`,
    `layouts/**/*.vue`,
    `pages/**/*.vue`,
    `composables/**/*.{js,ts}`,
    `plugins/**/*.{js,ts}`,
    `App.{js,ts,vue}`,
    `app.{js,ts,vue}`,
  ],
  darkMode: "selector",
  theme: {
    extend: {
      colors: {
        brand_primary: "#124BCF",
        brand_secondary: "#5eceeb",
        brand_secondary_saturated: "#5eceeb",
        typography_primary: "#000000",
        background: "#ffffff",
      },
      padding: {
        section_x_sm: "1.5rem",
        section_x: "5rem",
        section_y_sm: "3rem",
        section_y: "5rem",
      },
      spacing: {
        nav: "4rem",
        section_x: "5rem",
      },
    },
  },
  plugins: [],
};
