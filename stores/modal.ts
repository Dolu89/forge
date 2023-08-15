import { defineStore } from 'pinia'

export const useModalStore = defineStore('modal', {
  state: (): { showCreateRelayModal: boolean } => {
    return { showCreateRelayModal: false }
  },
  getters: {
  },
  actions: {
    toggleModal() {
      this.showCreateRelayModal = !this.showCreateRelayModal;
    }
  },
})