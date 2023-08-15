<template>
  <div>
    <n-grid :x-gap="12" :y-gap="8" :cols="4">
      <n-grid-item v-for="(relay, index) in relaysStore.getAll" :keys="index">
        <n-card :title="`${relay.relayType}:${relay.port}`" size="small">
          <relay-card :relay="relay" />
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { useRelaysStore } from "~/stores/relays";

const relaysStore = useRelaysStore();
</script>
