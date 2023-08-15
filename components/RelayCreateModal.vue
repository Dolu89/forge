<template>
  <n-form ref="formRef" :model="modelRef" :rules="rules">
    <n-modal
      v-model:show="modalStore.showCreateRelayModal"
      :mask-closable="false"
      :closable="false"
      preset="dialog"
      title="Add new relay"
      positive-text="Create"
      negative-text="Cancel"
      :show-icon="false"
    >
      <n-form-item path="relayType" label="App">
        <n-select
          v-model:value="modelRef.relayType"
          :options="relayDataAppSelect"
        />
      </n-form-item>
      <n-form-item path="version" label="Version">
        <n-select
          v-model:value="modelRef.version"
          :options="relayDataVersionSelect"
        />
      </n-form-item>

      <template #action>
        <n-button @click="onNegativeClick">Cancel</n-button>
        <n-button type="primary" @click="onPositiveClick">Create</n-button>
      </template>
    </n-modal>
  </n-form>
</template>

<script setup lang="ts">
import { useRelaysStore } from "@/stores/relays";
import { useModalStore } from "@/stores/modal";
import { FormInst, FormRules, FormValidationError } from "naive-ui";
import { ref } from "vue";
import relayData from "~/data/relay";
import { RelayType } from "~/enums";

const relaysStore = useRelaysStore();
const modalStore = useModalStore();
const formRef = ref<FormInst | null>(null);
const message = useMessage();
interface ModelType {
  relayType: string | null;
  version: string | null;
}
const modelRef = ref<ModelType>({
  relayType: null,
  version: null,
});

const relayDataAppSelect = relayData.map((item) => {
  return {
    label: item.name,
    value: item.name,
  };
});

const relayDataVersionSelect = computed(() => {
  return relayData
    .find((item) => item.name === modelRef.value.relayType)
    ?.tags.map((item) => {
      return {
        label: item,
        value: item,
      };
    });
});

function onPositiveClick() {
  formRef.value?.validate(
    async (errors: Array<FormValidationError> | undefined) => {
      if (!errors) {
        await relaysStore.add(
          modelRef.value.relayType! as RelayType,
          modelRef.value.version!
        );
        message.success("Relay created");
        modalStore.showCreateRelayModal = false;
        modelRef.value = {
          relayType: null,
          version: null,
        };
      } else {
        console.log(errors);
        message.error("Error while creating relay");
      }
    }
  );
}
function onNegativeClick() {
  modalStore.showCreateRelayModal = false;
  modelRef.value = {
    relayType: null,
    version: null,
  };
}

const rules: FormRules = {
  relayType: [
    {
      required: true,
      message: "Relay type is required",
    },
  ],
  version: [
    {
      required: true,
      message: "Version is required",
    },
  ],
};
</script>
