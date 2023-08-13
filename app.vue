<template>
  <div>
    <button @click="launch">Launch/Kill</button>
  </div>
</template>

<script setup lang="ts">
async function launch() {
  await useFetch("/api/test");
}
</script>
