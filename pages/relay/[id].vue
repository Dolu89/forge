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
let eventSource: EventSource | null = null;

onBeforeMount(async () => {
  await fetchLogs(Number(route.params.id));
  relayStore.setCurrent(Number(route.params.id));
});

onUnmounted(() => {
  eventSource?.close();
  eventSource = null;
});

watch(
  () => relayStore.getCurrent?.status,
  async (status: DockerStatus | undefined) => {
    if (status === DockerStatus.Running) {
      await fetchLogs(Number(route.params.id));
    } else {
      eventSource?.close();
      eventSource = null;
    }
  }
);

async function fetchLogs(id: number) {
  if (eventSource) return;

  const relay = await RelayService.getById(id);
  if (relay?.status !== DockerStatus.Running) return;

  const url = new URL(`/api/docker/logs`, window.location.origin);

  for (const containerId of relay?.containerIds ?? []) {
    url.searchParams.append("containerIds", containerId);
  }

  eventSource = new EventSource(url.toString());
  eventSource.onmessage = (event) => {
    logRef.value += event.data + "\n";
    logInstRef.value?.scrollTo({ position: "bottom", slient: true });
  };
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
