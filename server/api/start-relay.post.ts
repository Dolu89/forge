import { fork } from 'child_process';
import RelayService from '~/services/RelayService';

export default defineEventHandler(async (event) => {
  const body: { port: number } = await readBody(event)

  if (RelayService.server_getChildProcessByPort(body.port)) {
    return {
      status: `${body.port} already running`,
    }
  }

  const child = fork('./child-process/relay.js', {
    env: {
      PORT: body.port.toString()
    }
  });

  RelayService.server_pushChildProcess(body.port, child)

  return {
    status: 'ok',
    port: body.port
  }
})
