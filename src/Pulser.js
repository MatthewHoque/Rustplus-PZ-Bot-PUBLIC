const helpers = require("./helpers.js");
const rr = require("./reqReg.js");

class Pulser {
  constructor(
    vp,
    name,
    deviceId,
    pulseStart,
    loopDelay,
    callbackDelay,
    priority
  ) {
    this.vp = vp;
    this.loopCheck = true;
    this.paused = false;
    this.name = name;
    this.deviceId = deviceId;
    this.pulseStart = pulseStart;
    this.loopDelay = +loopDelay + +callbackDelay;
    this.callbackDelay = callbackDelay;
    this.typeCall = pulseStart == "on" ? 1 : 0;
    this.typePostCall = pulseStart == "on" ? 0 : 1;
    if (this.pulseStart == "toggle") {
      this.typeCall = -1;
      this.typePostCall = -1;
    }
    this.priority = priority;
    this.save();
  }

  async start() {
    // console.log(this.name, this.loopCheck);
    while (this.loopCheck) {
      if (!this.paused) {
        rr.regPulserTrigger(this.vp, this);
        // console.log(`waiting ${this.loopDelay} A`)
        await helpers.delay(this.loopDelay);
      } else {
        await helpers.delay(5000);
      }
    }
  }

  async stop() {
    this.vp.dat.pulserBank[this.name] = undefined;
    console.log(this.vp.dat.pulserIdToName[this.deviceId].length);
    if (Object.keys(this.vp.dat.pulserIdToName[this.deviceId]).length == 1) {
      this.vp.dat.pulserIdToName[this.deviceId] = undefined;
    } else {
      this.vp.dat.pulserIdToName[this.deviceId][this.name] = undefined;
    }

    console.log(this.loopCheck, "stopping");
    this.vp.writeDat();
    this.loopCheck = false;
  }

  pause() {
    this.paused = true;
    this.save();
  }

  continue() {
    this.paused = false;
    this.save();
  }

  rebuildPulse(rebuild) {
    this.paused = rebuild.paused;
    this.loopCheck = rebuild.loopCheck;
  }

  export() {
    return {
      loopCheck: this.loopCheck,
      paused: this.paused,
      name: this.name,
      deviceId: this.deviceId,
      pulseStart: this.pulseStart,
      loopDelay: this.loopDelay - this.callbackDelay,
      callbackDelay: this.callbackDelay,
      typeCall: this.typeCall,
      typePostCall: this.typePostCall,
      priority: this.priority,
    };
  }

  rename(newName) {
    this.vp.dat.pulserBank[this.name] = undefined;
    this.vp.dat.pulserIdToName[this.deviceId][this.name] = undefined;
    this.name = newName;
    this.save();
  }

  processArgs(args) {
    this.rename(args[3]);
    this.deviceId = args[4];
    this.pulseStart = args[5];
    this.callbackDelay = args[7];
    this.loopDelay = +args[6] + +args[7];
    this.priority = args[8];
    // this.loopCheck = true;
    // this.paused = false;
    this.typeCall = this.pulseStart == "on" ? 1 : 0;
    this.typePostCall = this.pulseStart == "on" ? 0 : 1;
    if (this.pulseStart == "toggle") {
      this.typeCall = -1;
      this.typePostCall = -1;
    }
    this.save();
  }

  save() {
    this.vp.dat.pulserBank[this.name] = this.export();
    if (this.vp.dat.pulserIdToName[this.deviceId] == undefined) {
      this.vp.dat.pulserIdToName[this.deviceId] = {};
    }
    this.vp.dat.pulserIdToName[this.deviceId][this.name] = true;
    this.vp.writeDat();
  }
}
module.exports = Pulser;
