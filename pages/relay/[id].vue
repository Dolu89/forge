<template>
  <n-config-provider :hljs="hljs">
    <n-page-header
      :subtitle="relayStore.getCurrent?.relayTag"
      @back="navigateTo('/')"
    >
      <template #title>
        {{ relayStore.getCurrent?.relayType }}:{{ relayStore.getCurrent?.port }}
        <n-tag
          v-if="relayStore.getCurrent?.status === DockerStatus.Running"
          type="success"
        >
          Running
        </n-tag>
        <n-tag
          v-if="relayStore.getCurrent?.status === DockerStatus.Partial"
          type="warning"
        >
          Partial
        </n-tag>
        <n-tag
          v-if="relayStore.getCurrent?.status === DockerStatus.Stopped"
          type="error"
        >
          Stopped
        </n-tag>
      </template>
      <template #extra>
        <n-space>
          <n-button
            @click="start(relayStore.getCurrent?.port!)"
            v-if="relayStore.getCurrent?.status !== DockerStatus.Running"
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
            @click="stop(relayStore.getCurrent?.port)"
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
            @click="remove(relayStore.getCurrent?.id!)"
            quaternary
            size="small"
            type="error"
            :disabled="btnDisabled"
            :loading="btnDeleteLoading"
            icon-placement="left"
          >
            Delete
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <h2>Logs</h2>

    <div
      style="
        background-color: black;
        color: white;
        padding: 15px;
        border-radius: 15px;
      "
    >
      <n-log
        v-if="relayStore.getCurrent?.status === DockerStatus.Running"
        :font-size="12"
        :line-height="1.75"
        :rows="30"
        ref="logInstRef"
        :log="logRef"
        language="bash"
      />
      <span v-else>Relay stopped. Start relay to fetch logs</span>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { LogInst } from "naive-ui";
import { DockerStatus } from "~/enums";
import { useRelaysStore } from "~/stores/relays";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";

hljs.registerLanguage("bash", bash);

const logInstRef = ref<LogInst | null>(null);
const logRef = ref("");
const route = useRoute();
const relayStore = useRelaysStore();
const { $docker } = useNuxtApp();

const id = Number(route.params.id);
let isStreamingLogs = false;

onBeforeMount(async () => {
  await streamLogs(id);
  relayStore.setCurrent(id);
});

onUnmounted(() => {
  stopStreamLogs();
});

watch(
  () => relayStore.getCurrent?.status,
  async (status: DockerStatus | undefined) => {
    if (status === DockerStatus.Running) {
      await streamLogs(id);
    } else {
      stopStreamLogs();
    }
  }
);

async function streamLogs(id: number) {
  if (isStreamingLogs) return;

  const relay = await RelayService.getById(id);
  if (relay?.status !== DockerStatus.Running) return;

  $docker.streamLogs(id.toString(), relay, (data) => {
    logRef.value += data + "\n";
    logInstRef.value?.scrollTo({ position: "bottom", slient: true });
  });

  isStreamingLogs = true;
}

function stopStreamLogs() {
  $docker.stopStreamLogs(id.toString());
  isStreamingLogs = false;
}

const btnDisabled = ref(false);
const btnStartStopLoading = ref(false);
const btnDeleteLoading = ref(false);

async function start(port: number) {
  btnDisabled.value = true;
  btnStartStopLoading.value = true;
  await relayStore.start(port);
  btnDisabled.value = false;
  btnStartStopLoading.value = false;
}
async function stop(port: number) {
  btnDisabled.value = true;
  btnStartStopLoading.value = true;
  await relayStore.stop(port);
  btnDisabled.value = false;
  btnStartStopLoading.value = false;
}

async function remove(id: number) {
  btnDisabled.value = true;
  btnDeleteLoading.value = true;
  await relayStore.remove(id);
  navigateTo("/");
}
</script>
