import RelayService from '~/services/RelayService';

export default defineEventHandler(async (event) => {
  const body: { port: number } = await readBody(event)


  const child = RelayService.server_getChildProcessByPort(body.port)

  if (child) {
    child.kill()
    RelayService.server_removeChildProcess(body.port)
    
    return {
      status: 'ok',
      port: body.port
    }
  }

  return {
    status: `${body.port} not running`,
  }
})
