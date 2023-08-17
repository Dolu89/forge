<template>
  <n-message-provider>
    <n-layout content-style="padding: 24px;">
      <n-layout-header>
        <n-page-header>
          <template #title> Forge </template>
          <template #avatar>
            <nostr-icon style="height: 36px; color: #5d0c8b" />
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

</script>