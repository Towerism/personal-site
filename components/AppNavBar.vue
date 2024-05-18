<template>
  <nav class="nav-wrapper">
    <HamburgerButton
      v-model="mobileNavOpen"
      class="m-[-0.60rem] inline md:hidden"
    />
    <div class="m-[-0.50rem]">
      <NuxtLink
        v-for="link of links"
        v-bind="link.props"
        :key="link.text"
        class="nav-link"
        >{{ link.text }}</NuxtLink
      >
    </div>
    <DarkModeToggle />
  </nav>
  <nav class="mobile-nav-wrapper" v-if="mobileNavOpen">
    <div v-for="link of links" :key="link.text" class="nav-link-mobile-wrapper">
      <NuxtLink v-bind="link.props" class="nav-link-mobile">{{
        link.text
      }}</NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onBeforeRouteUpdate, type RouteLocationRaw } from "#vue-router";

defineProps<{
  links: Array<{
    text: string;
    props: { to: RouteLocationRaw };
  }>;
}>();

const mobileNavOpen = ref(false);

onBeforeRouteUpdate(() => {
  mobileNavOpen.value = false;
});

watch(mobileNavOpen, updateScrollLock);

function updateScrollLock(val: boolean) {
  if (val) {
    document.body.classList.add("scroll-lock");
  } else {
    document.body.classList.remove("scroll-lock");
  }
}
</script>

<style scoped lang="scss">
.nav-wrapper,
.mobile-nav-wrapper {
  @apply flex relative border-gray-200 dark:border-gray-700 text-gray-900 bg-gray-50 dark:bg-gray-900 bg-opacity-60 dark:text-gray-100;
}

.nav-wrapper {
  @apply items-center justify-between w-full max-w-2xl mx-auto pt-8 pb-8 sm:pb-16;
}

.mobile-nav-wrapper {
  @apply flex flex-col divide-y divide-gray-200 dark:divide-gray-700 -mt-6 h-screen float-left;
}

.nav-link,
.nav-link-mobile {
  @apply font-normal text-gray-600 dark:text-gray-400;
}

.nav-link {
  @apply hidden md:inline-block p-1 sm:px-3 sm:py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-all;
}

.nav-link-mobile-wrapper {
  @apply py-3;
}

.router-link-exact-active {
  @apply font-semibold;
}
</style>
