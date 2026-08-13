<script setup lang="ts">
// The function form of titleTemplate has to live here rather than in
// nuxt.config.ts — app.head is serialised into the build, so it only accepts
// a string there.
useHead({
  titleTemplate: (title?: string) =>
    title ? `${title} · Martin Fracker, Jr.` : "Martin Fracker, Jr.",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
