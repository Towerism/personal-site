<script setup lang="ts">
const copyrightYear = new Date().getFullYear();
</script>

<template>
  <footer class="footer">
    <hr class="footer-top-hr" />
    <div class="footer-content-wrapper">
      <p class="mb-3 font-semibold">
        © {{ copyrightYear }} Martin Fracker, Jr. All rights reserved.
      </p>
      <p class="text-sm text-gray-700">
        This website is built with
        <a
          href="https://nuxt.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="link"
          >Nuxt 4</a
        >
        &amp;
        <a
          href="https://tailwindcss.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="link"
          >Tailwind.css</a
        >
        and hosted on my
        <NuxtLink to="/home-network" class="link">home network </NuxtLink>.
        <br />
        The source code is available on
        <a
          href="https://github.com/Towerism/personal-site"
          target="_blank"
          rel="noopener noreferrer"
          class="link"
          >Github</a
        >.
      </p>
      <div class="mt-6 inline-flex"></div>
    </div>
  </footer>
</template>

<style scoped>
@reference "../assets/css/main.css";

.footer {
  @apply mx-auto mb-8 flex w-full max-w-2xl flex-col justify-center;
}

.footer-top-hr {
  @apply mb-8 w-full border-gray-200 dark:border-gray-800;
}

.footer-content-wrapper {
  @apply container mx-auto max-w-lg text-center text-gray-700;
}
</style>
