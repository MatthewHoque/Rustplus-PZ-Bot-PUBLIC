const helpers = require("./helpers.js");
const rr = require("./reqReg.js");
const Camera = require("@liamcottle/rustplus.js/camera.js");
const MyCamera = require("./MyCamera.js");
const { EventEmitter } = require("events");
const curryPot = require("./curryPot.js");

class CamHandler extends EventEmitter {
  constructor(vp) {
    super();
    // if (vp.dat.cameraDB == undefined) {
    //   vp.dat.cameraDB = {};
    // }
    // helpers.jsonUpdate(fs, vp.dataName, vp.dat);
    this.vp = vp;
    this.camera = undefined;
    this.currentCamera = undefined;
    this.currentPriority = undefined;
    this.subscribed = false;
    this.currentSequencer = undefined;
    this.repeats=undefined
    // this.registeringCamera = undefined;
  }

  setID(id) {
    this.cameraId = id;
    this.camera = new MyCamera(this.vp.rustplus, id);
  }

  setCamera(camera) {
    this.cameraId = camera.identifier;
    this.camera = camera;
  }

  subscribe(delay, priority) {
    this.subcribed = true;
    var curryCall = new curryPot(async () => {
      await this.camera.subscribe(delay);
    }, null);
    curryCall.setVars(priority, 1, 0);
    this.vp.throt.queueCameraReq(curryCall);
    this.vp.throt.processQueueLoop(); //PROCESS QUEUE LOOP NEEDS TO ME MODIFIED TO WORK WITH TWO HEAPS
  }

  unsubscribe(priority) {
    this.subcribed = false;
    var curryCall = new curryPot(async () => {
      await this.camera.unsubscribe();
    }, null);
    curryCall.setVars(priority, 1, 0);
    this.vp.throt.queueCameraReq(curryCall);
    this.vp.throt.processQueueLoop(); //PROCESS QUEUE LOOP NEEDS TO ME MODIFIED TO WORK WITH TWO HEAPS
  }

  setOnDataFunction(repeats,func) {
    this.onDataFunction = func;
    this.repeats=repeats
  }

  dataReceived(message) {
    if(this.repeats>0){
      this.onDataFunction.apply(this, [this.vp, message]);
      this.repeats-=1
    }
    
  }

  // allDataReceived(message) {
  //   if (message.broadcast && message.broadcast.cameraRays){
  //     if(this.vp.dat.cameraDB.){

  //     }
  //   }
  // }
}

module.exports = CamHandler;
