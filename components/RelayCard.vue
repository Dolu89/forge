<template>
  <div>Version: {{ relay.relayTag }}</div>
  <div>Status: {{ relay.status }}</div>
  <n-button
    @click="start(relay.port)"
    v-if="relay.status !== DockerStatus.Running"
    quaternary
    size="small"
    type="success"
    :disabled="btnDisabled"
    :loading="btnStartStopLoading"
    icon-placement="left"
  >
    Start
  </n-button>
  <n-button
    @click="stop(relay.port)"
    v-else
    quaternary
    size="small"
    type="warning"
    :disabled="btnDisabled"
    :loading="btnStartStopLoading"
    icon-placement="left"
  >
    Stop
  </n-button>
  <n-button
    @click="remove(relay.id!)"
    quaternary
    size="small"
    type="error"
    :disabled="btnDisabled"
    :loading="btnDeleteLoading"
    icon-placement="left"
  >
    Delete
  </n-button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { DockerStatus } from "~/enums";
import { useRelaysStore } from "@/stores/relays";
import { RelayExtended } from "interfaces";

const { relay } = defineProps<{
  relay: RelayExtended;
}>();

const relaysStore = useRelaysStore();

const btnDisabled = ref(false);
const btnStartStopLoading = ref(false);
const btnDeleteLoading = ref(false);

async function start(port: number) {
  btnDisabled.value = true;
  btnStartStopLoading.value = true;
  await relaysStore.start(port);
  btnDisabled.value = false;
  btnStartStopLoading.value = false;
}
async function stop(port: number) {
  btnDisabled.value = true;
  btnStartStopLoading.value = true;
  await relaysStore.stop(port);
  btnDisabled.value = false;
  btnStartStopLoading.value = false;
}

async function remove(id: number) {
  btnDisabled.value = true;
  btnDeleteLoading.value = true;
  await relaysStore.remove(id);
  btnDisabled.value = false;
  btnDeleteLoading.value = false;
}
</script>
