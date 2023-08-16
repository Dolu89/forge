<template>
  <div>
    <n-grid :x-gap="12" :y-gap="8" :cols="4">
      <n-grid-item v-for="(relay, index) in relaysStore.getAll" :keys="index">
        <n-card size="small">
          <template #header>
            <NuxtLink :to="`/relay/${relay.id}`">
              <n-button text tag="a" type="primary" size="large">
                {{ relay.relayType }}:{{ relay.port }}
              </n-button>
            </NuxtLink>
          </template>
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
