<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

defineProps<{
  links: Array<{
    text: string;
    props: { to: RouteLocationRaw };
  }>;
}>();

const route = useRoute();
const mobileNavOpen = ref(false);

// The original used onBeforeRouteUpdate/onBeforeRouteLeave, but those only bind
// to a component rendered inside <RouterView>. This nav lives in the layout,
// which sits outside it, so watch the path instead — closing the menu releases
// the scroll lock through the watcher below.
watch(
  () => route.path,
  () => {
    mobileNavOpen.value = false;
  },
);

watch(mobileNavOpen, updateScrollLock);

onBeforeUnmount(() => updateScrollLock(false));

function updateScrollLock(val: boolean) {
  if (import.meta.server) return;
  document.body.classList.toggle("scroll-lock", val);
}
</script>

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
  <nav v-if="mobileNavOpen" class="mobile-nav-wrapper">
    <div v-for="link of links" :key="link.text" class="nav-link-mobile-wrapper">
      <NuxtLink v-bind="link.props" class="nav-link-mobile">{{
        link.text
      }}</NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
@reference "../assets/css/main.css";

.nav-wrapper,
.mobile-nav-wrapper {
  @apply relative flex border-gray-200 bg-gray-50/60 text-gray-900 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100;
}

.nav-wrapper {
  @apply mx-auto w-full max-w-2xl items-center justify-between pt-8 pb-8 sm:pb-16;
}

.mobile-nav-wrapper {
  @apply -mt-6 h-screen flex-col divide-y divide-gray-200 float-left dark:divide-gray-700;
}

.nav-link,
.nav-link-mobile {
  @apply font-normal text-gray-600 dark:text-gray-400;
}

.nav-link {
  @apply hidden rounded-lg p-1 transition-all hover:bg-gray-200 md:inline-block sm:px-3 sm:py-2 dark:hover:bg-gray-800;
}

.nav-link-mobile-wrapper {
  @apply py-3;
}

.router-link-exact-active {
  @apply font-semibold;
}
</style>
