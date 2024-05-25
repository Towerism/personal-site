<template>
  <footer class="footer">
    <hr class="footer-top-hr" />
    <div class="footer-content-wrapper">
      <p class="mb-3 font-semibold">
        © 2024 Martin Fracker, Jr. All rights reserved.
      </p>
      <p class="text-sm text-gray-700">
        This website is built with
        <a
          href="https://v3.nuxtjs.org/"
          target="_blank"
          rel="noopener noreferrer"
          class="link"
          >Nuxt 3</a
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
      <div class="inline-flex mt-6"></div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  @apply flex flex-col justify-center max-w-2xl mx-auto w-full mb-8;
}

.footer-top-hr {
  @apply w-full border-gray-200 dark:border-gray-800 mb-8;
}

.footer-content-wrapper {
  @apply container max-w-lg mx-auto text-center text-gray-700;
}
</style>
