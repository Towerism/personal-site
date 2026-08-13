<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(`content:${route.path}`, () =>
  queryCollection("content").path(route.path).first(),
);

// Nuxt Content v2's <ContentDoc> handled this implicitly; v3 leaves the miss
// case to us, so also return a real 404 status instead of a 200 with 404 text.
if (!page.value) {
  const event = useRequestEvent();
  if (event) setResponseStatus(event, 404);
}

useSeoMeta({
  title: () => page.value?.title ?? "Page not found",
  description: () => page.value?.description,
});
</script>

<template>
  <ContentRenderer v-if="page" :value="page" />
  <AppPartial v-else path="/partials/404" />
</template>
