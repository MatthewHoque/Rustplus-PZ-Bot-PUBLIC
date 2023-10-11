const { EventEmitter } = require("events");
const FastPriorityQueue = require("fastpriorityqueue");
const tokenTracker = require("./tokenTracker.js");
const curryPot = require("./curryPot.js");
const helpers = require("./helpers.js");
class throttler extends EventEmitter {
  constructor(vp) {
    super();
    this.tracker = new tokenTracker(25, 3, 1100);
    this.queue = new FastPriorityQueue(curryPot.compareCurryPot); // initially empty
    this.cameraQueue = new FastPriorityQueue(curryPot.compareCurryPot); // initially empty
    this.processing = 0;
    this.cameraSubscribed = 0;
    this.vp = vp;
  }

  async processQueueLoop() {
    if (
      this.processing == 0 &&
      (!this.queue.isEmpty() ||
        (!this.cameraQueue.isEmpty() && !this.vp.camHandler.subscribed))
    ) {
      this.processing = 1; //dont need?
      var currentCurry = "NOCURRY";

      // console.log("camQueue", this.cameraQueue.isEmpty());
      // console.log("queue", this.queue.isEmpty());

      if (
        !this.queue.isEmpty() &&
        !this.cameraQueue.isEmpty() &&
        !this.vp.camHandler.subscribed
      ) {
        if (this.cameraQueue.peek().priority <= this.queue.peek().priority) {
          // console.log("camQueue1", this.cameraQueue.isEmpty());
          // console.log("queue1", this.queue.isEmpty());
          currentCurry = this.cameraQueue.poll();
          // console.log("CHOSEN CURRY 1", JSON.stringify(currentCurry));
        } else {
          // console.log("camQueue2", this.cameraQueue.isEmpty());
          // console.log("queue2", this.queue.isEmpty());
          currentCurry = this.queue.poll();
          // console.log("CHOSEN CURRY 2", JSON.stringify(currentCurry));
        }
      } else if (!this.queue.isEmpty()) {
        // console.log("camQueue22", this.cameraQueue.isEmpty());
        // console.log("queue22", this.queue.isEmpty());
        currentCurry = this.queue.poll();
        // console.log("CHOSEN CURRY 2.5", JSON.stringify(currentCurry));
      } else {
        // console.log("camQueue3", this.cameraQueue.isEmpty());
        // console.log("queue3", this.queue.isEmpty());
        currentCurry = await this.cameraQueue.poll();
        // console.log("camQueue3after", this.cameraQueue.isEmpty());
        // console.log("queue3ater", this.queue.isEmpty());
        // console.log(
        // "CHOSEN CURRY 3",
        // currentCurry,
        // JSON.stringify(currentCurry)
        // );
      }

      // console.log("Checking tokens",currentCurry.iniCost,this.tracker.currentTokens)
      while (!this.tracker.hasTokens(currentCurry.iniCost)) {
        console.log(
          "Current Tokens " +
            this.tracker.currentTokens +
            " reserved " +
            this.tracker.reservedTokens +
            " inicost " +
            currentCurry.iniCost,
          JSON.stringify(currentCurry)
        );
        this.tracker.updateTokens();
        await helpers.delay(500);
      }
      this.tracker.updateTokens();
      this.tracker.useTokens(currentCurry.iniCost);
      this.tracker.reserveTokens(currentCurry.reservedTokens);
      currentCurry.deployable();
      // console.log("polling==============");
      // console.log(this.tracker.reservedTokens);
      this.queue.trim();
      // console.log("----");
      // console.log(this.queue);
      // console.log("----");
      this.processing = 0; //dont need?
      // if (!this.queue.isEmpty()) {
      this.processQueueLoop();
      // }
    }
  }

  queueReq(curryPot) {
    this.queue.add(curryPot);
    // console.log(this.queue);
  }

  queueCameraReq(curryPot) {
    this.cameraQueue.add(curryPot);
    // console.log(this.queue);
  }

  queueOpt(opt, currypot) {
    if (opt == "camera") {
      this.cameraQueue.add(currypot);
      // console.log("added to camera queue");
    } else {
      this.queue.add(currypot);
      // console.log("addded to queue queue");
    }
  }
}
module.exports = throttler;
