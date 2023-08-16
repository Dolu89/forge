<template>
  <n-message-provider>
    <n-layout content-style="padding: 24px;">
      <n-layout-header>
        <n-page-header>
          <template #title> Forge </template>
          <template #avatar>
            <nostr-icon style="height: 36px; color: #5d0c8b" />
          </template>
          <template #extra>
            <n-space>
              <n-button @click="startAll">Start all</n-button>
              <n-button @click="stopAll">Stop all</n-button>
              <n-button @click="modalStore.toggleModal()"
                >Create relay</n-button
              >
            </n-space>
          </template>
        </n-page-header>
      </n-layout-header>
      <n-layout-content content-style="margin-top: 24px;">
        <slot />
        <relay-create-modal />
      </n-layout-content>
    </n-layout>
  </n-message-provider>
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