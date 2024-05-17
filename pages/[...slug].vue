<template>
  <div class="flex flex-col justify-center px-8 pt-4">
    <AppNavBar />
  </div>
  <div class="flex flex-col justify-center px-8 py-4">
    <main
      id="main"
      class="flex flex-col justify-center max-w-2xl mx-auto bg-standard"
    >
      <div class="flex flex-col justify-center">
        <ContentDoc />
      </div>
    </main>
  </div>
  <AppFooter />
</template>
