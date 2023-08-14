<template>
    <div>
      <n-button @click="startAll">Start all</n-button>
      <n-button @click="stopAll">Stop all</n-button>
      <n-button @click="launch">New relay</n-button>
      <relay-list />
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRelaysStore } from "@/stores/relays";
  const relaysStore = useRelaysStore();
  
  onBeforeMount(async () => {
    await relaysStore.initStore();
  });
  
  async function launch() {
    await relaysStore.add();
  }
  
  async function startAll() {
    await relaysStore.startAll();
  }
  
  async function stopAll() {
    await relaysStore.stopAll();
  }
  </script>
  