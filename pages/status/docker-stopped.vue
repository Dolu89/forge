<template>
  <div class="parent">
    <div class="status">
      <h1>Oops, Docker is not running</h1>
      <n-button
        type="primary"
        @click="checkStatus"
        :loading="loading"
        icon-placement="left"
      >
        Refresh docker status
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DockerStatus } from "~/enums";

definePageMeta({
  layout: "status",
});

const { $docker } = useNuxtApp();
const loading = ref(false);
async function checkStatus() {
  loading.value = true;
  const status = await $docker.getDockerStatus();
  if (status === DockerStatus.Running) {
    navigateTo("/");
  }
  loading.value = false;
}
</script>

<style>
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}
.status {
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
