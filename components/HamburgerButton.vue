<script setup>
const activated = defineModel({ default: false });
</script>

<template>
  <button
    class="burger visible md:hidden"
    aria-label="Toggle menu"
    type="button"
    @click="activated = !activated"
  >
    <svg
      :data-hide="activated"
      class="h-5 w-5 absolute text-gray-900 dark:text-gray-100"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      stroke="currentColor"
      strokewidth="1.5"
      strokelinecap="round"
      strokelinejoin="round"
      fill="none"
    >
      <path d="M2.5 7.5H17.5"></path>
      <path d="M2.5 12.5H17.5"></path>
    </svg>
    <svg
      :data-hide="!activated"
      class="h-5 w-5 absolute text-gray-900 dark:text-gray-100"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokewidth="1.5"
      strokelinecap="round"
      strokelinejoin="round"
      fill="none"
      shaperendering="geometricPrecision"
    >
      <path d="M18 6L6 18"></path>
      <path d="M6 6l12 12"></path>
    </svg>
  </button>
</template>

<style scoped>
.burger {
  transition: opacity 300ms ease;
  border: 0;
  background: transparent;
  width: 40px;
  height: 40px;
  position: relative;
}

.burger svg {
  transform: translate(-50%, -50%) scale(1);
  top: 50%;
  left: 50%;
  opacity: 1;
  transition:
    opacity 300ms ease,
    transform 300ms ease;
}

.burger svg[data-hide="true"] {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
}
</style>
