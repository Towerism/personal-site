<script setup lang="ts">
import { useStorage } from "@vueuse/core";

type Theme = "" | "dark" | "light";

// The inline bootstrap script in nuxt.config.ts reads this same key before
// first paint; keep the two in sync if the storage shape ever changes.
const theme = useStorage<Theme>("theme", "");

const isDark = computed(() => theme.value === "dark");

onBeforeMount(() => {
  if (theme.value) {
    setTheme(theme.value);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    setTheme("dark");
  }
});

watch(theme, setTheme);

function setTheme(value: Theme) {
  document.documentElement.classList.toggle("dark", value === "dark");
}
</script>

<template>
  <!-- ClientOnly: the rendered icon depends on localStorage, which the server
       cannot know, so rendering it during SSR guarantees a hydration mismatch.
       The fallback reserves the same box to avoid a layout shift. -->
  <ClientOnly>
    <button
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      :aria-pressed="isDark"
      type="button"
      class="toggle"
      @click="theme = isDark ? 'light' : 'dark'"
    >
      <svg
        v-if="!isDark"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        class="h-5 w-5 text-gray-800 dark:text-gray-200"
      >
        <path
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        ></path>
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        class="h-5 w-5 text-gray-800 dark:text-gray-200"
      >
        <path
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        ></path>
      </svg>
    </button>

    <template #fallback>
      <div class="toggle" aria-hidden="true"></div>
    </template>
  </ClientOnly>
</template>

<style scoped>
@reference "../assets/css/main.css";

.toggle {
  @apply flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 ring-gray-300 transition-all hover:ring-2 dark:bg-gray-600;
}
</style>
