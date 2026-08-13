<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

const links: Array<{ text: string; props: { to: RouteLocationRaw } }> = [
  { text: "Home", props: { to: "/" } },
  { text: "Home network", props: { to: "/home-network" } },
  { text: "About", props: { to: "/about" } },
];
</script>

<template>
  <div class="flex flex-col justify-center px-8">
    <AppNavBar :links="links" />
  </div>
  <div class="flex flex-col justify-center px-8 py-4">
    <main
      id="main"
      class="bg-standard mx-auto flex max-w-2xl flex-col justify-center"
    >
      <div class="flex flex-col justify-center">
        <slot />
      </div>
    </main>
  </div>
  <AppFooter />
</template>
