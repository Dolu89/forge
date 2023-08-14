<template>
  <n-card
    :title="`Relay ${relay.port}`"
    size="small"
    v-for="(relay, index) in relaysStore.getAll"
    :keys="index"
  >
    Running: {{ relay.running }}
    <n-button
      @click="relaysStore.start(relay.port)"
      v-if="!relay.running"
      quaternary
      size="small"
      type="success"
    >
      Start
    </n-button>
    <n-button
      @click="relaysStore.stop(relay.port)"
      v-else
      quaternary
      size="small"
      type="warning"
    >
      Stop
    </n-button>
    <n-button
      @click="relaysStore.remove(relay.id)"
      quaternary
      size="small"
      type="error"
    >
      Delete
    </n-button>
  </n-card>
</template>

<script setup lang="ts">
import { useRelaysStore } from "@/stores/relays";
const relaysStore = useRelaysStore();
</script>
