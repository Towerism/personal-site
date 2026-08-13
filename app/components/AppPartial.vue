<script setup lang="ts">
const props = defineProps<{
  path: string;
}>();

const { data } = await useAsyncData(`partial:${props.path}`, () =>
  queryCollection("partials").path(props.path).first(),
);
</script>

<template>
  <ContentRenderer v-if="data" :value="data" />
</template>
