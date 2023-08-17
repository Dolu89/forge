import { DockerStatus } from "~/enums"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { $docker } = useNuxtApp()
  const status = await $docker.getDockerStatus()
  if (status === DockerStatus.Stopped && to.path !== '/status/docker-stopped') {
    return navigateTo('/status/docker-stopped')
  }
})