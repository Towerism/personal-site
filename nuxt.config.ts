import tailwindcss from "@tailwindcss/vite";

// Applies the persisted / preferred colour scheme before first paint so the
// page never flashes light before the toggle hydrates. Kept in sync with
// app/components/DarkModeToggle.vue (both read the "theme" localStorage key).
const themeBootstrap = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-08-12",
  devtools: { enabled: true },

  modules: ["@nuxt/content", "@vueuse/nuxt"],

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
      script: [{ innerHTML: themeBootstrap, tagPosition: "head" }],
    },
  },

  // The three real pages are prerendered at build time (the nav links reach
  // them all); unknown paths still fall through to the server so they can
  // render the 404 partial with a genuine 404 status.
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ["/"],
    },
  },
});
