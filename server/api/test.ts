import { ChildProcess, fork } from 'child_process';

let isLaunched = false
let child: ChildProcess;
export default defineEventHandler((event) => {

  if (!isLaunched) {
    console.log('launching child process')
    child = fork('./child-process/relay.js', {
      env: {
        PORT: '3121'
      }
    });
    isLaunched = true
  } else {
    console.log('child process already launched. Killing it')
    child.kill()
    isLaunched = false
  }

  return {
    hello: 'world'
  }
})
