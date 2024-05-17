<template>
  <nav
    class="flex items-center justify-between w-full relative max-w-2xl mx-auto border-gray-200 dark:border-gray-700 mx-auto pt-8 pb-8 sm:pb-16 text-gray-900 bg-gray-50 dark:bg-gray-900 bg-opacity-60 dark:text-gray-100"
  >
    <div class="m-[-0.50rem]">
      <NuxtLink to="/" class="nav-link">Home</NuxtLink>
      <NuxtLink to="/home-network" class="nav-link">Home network</NuxtLink>
      <NuxtLink to="/about" class="nav-link">About me</NuxtLink>
    </div>
    <DarkModeToggle />
  </nav>
</template>

<style scoped>
.nav-link {
  @apply font-normal text-gray-600 dark:text-gray-400 hidden md:inline-block p-1 sm:px-3 sm:py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-all;
}

.router-link-exact-active {
  @apply font-semibold;
}
</style>
