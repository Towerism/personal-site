<template>
  <ContentQuery :path="partial" find="one" v-slot="{ data }">
    <ContentRenderer :value="data" />
  </ContentQuery>
</template>

<script setup>
defineProps({
  partial: {
    type: String,
    required: true,
  },
});
</script>
