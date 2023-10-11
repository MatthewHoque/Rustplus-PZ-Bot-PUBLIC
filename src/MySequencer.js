const curryPot = require("./curryPot.js");
const helpers = require("./helpers.js");
const rr = require("./reqReg.js");
const Camera = require("@liamcottle/rustplus.js/camera.js");
const MyCamera = require("./MyCamera.js");

class Sequencer {
  constructor(vp) {
    this.vp = vp;
    this.sequence = [];
    this.sequenceIndex = 0;
    this.triggerFlag = false;
    this.continueFlag = true;
    this.sequencerName=""
  }

  registerSequencerCall(sequencerNode) {
    this.sequence.push(sequencerNode);
  }

  triggerSequence() {
    // console.log("TRRIGGERED  OUT", this.triggerFlag);
    if (!this.triggerFlag && this.continueFlag) {
      // console.log("TRRIGGERED", this.triggerFlag);
      // console.log(this.sequenceIndex);
      if (this.sequence[this.sequenceIndex].queue != "direct") {
        this.vp.throt.queueOpt(
          this.sequence[this.sequenceIndex].queue,
          this.sequence[this.sequenceIndex].curry
        );
        // console.log(this.sequence[this.sequenceIndex].curry);
        this.vp.throt.processQueueLoop();
      } else {
        // console.log("through direct ===============");
        this.sequence[this.sequenceIndex].curry.deployable();
      }

      this.sequenceIndex += 1;
      if (this.sequence.length == this.sequenceIndex) {
        this.sequenceIndex = 0;
      }
    }
  }

  simpleCameraSequence(seqname,id, falseLoopDelay, priority, channelId) {
    this.sequencerName=seqname
    this.channelId = channelId;
    this.camera = new MyCamera(this.vp.rustplus, id);

    var func = (camera, priority, sequencer, vp) => {
      vp.camHandler.setCamera(camera);
      vp.camHandler.subscribe(0, priority);
      vp.camHandler.currentSequencer = sequencer;
      this.triggerFlag = false;
      // console.log("NODE 1", this.triggerFlag, vp.camHandler.cameraId);
      vp.camHandler.setOnDataFunction(1, (vp, message) => {
        // console.log("onData Called");
        var names = "";
        message.broadcast.cameraRays.entities.forEach((entity) => {
          if (
            (entity.type =
              "Tree" &&
              entity.name &&
              !vp.dat.camIgnore.hasOwnProperty(entity.entityId))
          ) {
            // console.log("namebefore",names,names.length)
            names += `- ${entity.name}(${entity.entityId})\n`;
            // console.log("nameafter",names,names.length)
            // console.log(vp.camHandler.cameraId + " " + entity.name);
          }
          
        });
        // console.log("NAMES",names,names.length)
        if (names.length>1) {
          const channel = vp.client.channels.cache.get(
            vp.camHandler.currentSequencer.channelId
          );
          channel.send(
            `${helpers.ts(2)} :camera_with_flash: ${vp.camHandler.currentSequencer.sequencerName} |:| \`\`\`${names}\`\`\``
          );
        }
        // console.log(
        //   "ondata",
        //   this.triggerFlag,
        //   JSON.stringify(message.broadcast.cameraRays.distance)
        // );
        // if (message.broadcast && message.broadcast.cameraRays.distance) {
        // console.log(
        //   message.broadcast.cameraRays.distance,
        //   message.broadcast.cameraRays.verticalFov,
        //   message.broadcast.cameraRays.sampleOffset
        // );
        // }
        sequencer.triggerSequence();
        this.triggerFlag = true;
      });
    };

    var curryCall = new curryPot(
      func,
      null,
      this.camera,
      priority,
      this,
      this.vp
    );

    curryCall.setVars(priority, 0, 0);
    var seqData = { curry: curryCall, queue: "camera" };

    this.registerSequencerCall(seqData);

    var func2 = async (falseLoopDelay, sequencer, vp) => {
      // console.log("NODE 2", vp.camHandler.cameraId);
      vp.camHandler.unsubscribe(priority);
      vp.camHandler.currentSequencer = undefined;
      await helpers.delay(falseLoopDelay);
      this.triggerFlag = false;
      sequencer.triggerSequence();
    };

    var curryCall2 = new curryPot(func2, null, falseLoopDelay, this, this.vp);
    curryCall2.setVars(priority, 0, 0);
    var seqData2 = { curry: curryCall2, queue: "direct" };
    this.registerSequencerCall(seqData2);
    this.triggerSequence();
  }
}

module.exports = Sequencer;
