const { fork } = require('child_process');
var helpers = require("./helpers.js");

async function startChildProcess() {
  
  console.log("Forking Soon")
  await helpers.delay(1000)
  console.log(helpers.ts(2))
  const childProcess = fork('src/main.js');

  childProcess.on('exit', async (code, signal) => {
    console.error(helpers.ts()+` Child process exited with code ${code}. Restarting in a sec...`);
    await helpers.delay(120000)
    if (signal !== 'SIGTERM') {
      console.log(helpers.ts(2))
      console.error("OK RESTARTING NOW")
      startChildProcess();
    }
  });
}

startChildProcess();



