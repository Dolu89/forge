<template>
  <div>
    <n-button @click="startAll">Start all</n-button>
    <n-button @click="stopAll">Stop all</n-button>
    <n-button @click="modalStore.toggleModal()">Create relay</n-button>

    <n-card
      :title="`${relay.relayType}:${relay.port}`"
      size="small"
      v-for="(relay, index) in relaysStore.getAll"
      :keys="index"
    >
      <relay-card :relay="relay" />
    </n-card>

    <relay-create-modal />
  </div>
</template>

<script setup lang="ts">
import { useRelaysStore } from "~/stores/relays";
import { useModalStore } from "~/stores/modal";

const relaysStore = useRelaysStore();
const modalStore = useModalStore();

onBeforeMount(async () => {
  await relaysStore.initStore();
});

async function startAll() {
  await relaysStore.startAll();
}

async function stopAll() {
  await relaysStore.stopAll();
}
</script>
