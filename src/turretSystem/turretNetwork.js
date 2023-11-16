const { EventEmitter } = require("@liamcottle/rustplus.js");
const helpers = require("../helpers.js");
const rr = require("../reqReg.js");
const MaxPriorityQueue = require("./MaxPriorityQueue.js");

class turretNetwork extends EventEmitter {
  constructor(vp, turretDataFile, networkName) {
    super();

    this.vp = vp;
    this.processes = {};
    this.cycleIndex = 0;
    this.cycleEnable = false;
    this.pausedOnTarget = false;
    this.networkName = networkName;
    this.emergencyQueue = new MaxPriorityQueue();
    this.hbfHash = {};
    this.hasTargetHash = {};

    // this.sumOfTurrets= 0
    this.currentTimers = [];
    this.currentGroups = {};
    this.nextGroups = {};
    this.currentCycleExtendTimer = 0;

    this.currentGroupsSNAP = {};
    this.nextGroupsSNAP = {};

    this.tData = turretDataFile;
    if (!this.tData["networks"]) {
      console.log("could not find networks in turret data file");
      return;
    }

    this.nData = this.tData["networks"][this.networkName];

    if (!this.tData["networks"][networkName]) {
      console.log(
        "could not find network with specified name in turret data file"
      );
      return;
    }

    this.prepAlarmHash();

    this.on("cycle", () => {
      console.log("cycling emitted | on catch");
      this.cycle();
    });

    // this.on("HBF-Sense", () => {
    //   this.stopCurrentCycle();
    // });

    this.cycle();
  }

  prepAlarmHash() {
    //could go from id to id but will not circumvent group name incase future expandability
    var groups = this.nData["groups"];
    for (let group in groups) {
      groups[group]["hbfList"].forEach((id) => {
        this.hbfHash[id] = group;
      });
      groups[group]["hasTarget"].forEach((id) => {
        this.hasTargetHash[id] = group;
      });
    }

    console.log(this.hbfHash);
    console.log(this.hasTargetHash);
  }

  // Function that runs code with parameters after X milliseconds
  runAfterDelay(delayMs) {
    let timeoutId;
    let resolveFunction;
    let rejectFunction;

    const promise = new Promise((resolve, reject) => {
      resolveFunction = resolve;
      rejectFunction = reject;

      timeoutId = setTimeout(() => {
        resolve("Code executed after " + delayMs + " milliseconds");
      }, delayMs);
    });

    // Attach the timeoutId to the promise for cancellation
    promise.cancel = () => {
      clearTimeout(timeoutId);
      rejectFunction(new Error("Promise canceled"));
    };

    return promise;
  }

  cycle(snap) {
    console.log("========= Cycling =======");
    // if (snap) {
      // this.currentGroups = JSON.parse(JSON.stringify(this.currentGroupsSNAP));
      // this.nextGroups = JSON.parse(JSON.stringify(this.nextGroupsSNAP));
      // console.log(this.currentGroupsSNAP, this.nextGroupsSNAP);
      // console.log(this.currentGroups, this.nextGroups);
      // console.log("====SPECIAL=====")
    // }

    if (this.pausedOnTarget) {
      //   this.cycleIndex -= 1;
      return;
    }

    const time = this.nData["order"][this.cycleIndex]["time"];
    const hasTargetTime = this.nData["order"][this.cycleIndex]["hasTargetTime"];
    this.currentCycleExtendTimer = hasTargetTime;

    // for (let group in this.currentGroups) {
    //   if (this.currentGroups.hasOwnProperty(group)) {
    //     if (!this.nData["order"][this.cycleIndex]["glist"].includes(group)) {
    //       this.currentGroups[group] = false;
    //       console.log(`removing ${group} from currentGroups`);
    //     }
    //   }
    // }

    this.nData["order"][this.cycleIndex]["glist"].forEach((turrGroup) => {
      this.nextGroups[turrGroup] = this.nData["groups"][turrGroup]["size"];
      console.log(`${turrGroup} added to nextGroup, next cycle in ${time}`);
      //   this.sumOfTurrets+=this.nData["groups"][turrGroup]["size"]
      // if (!this.currentGroups[turrGroup]) {
      //   this.currentGroups[turrGroup] = this.nData["groups"][turrGroup]["size"];
      // }
    });
    // console.log(this.nextGroups);

    // this.currentGroupsSNAP = JSON.parse(JSON.stringify(this.currentGroups));
    // this.nextGroupsSNAP = JSON.parse(JSON.stringify(this.nextGroups));

    // console.log(this.currentGroupsSNAP, this.nextGroupsSNAP);
    // console.log(this.currentGroups, this.nextGroups);

    this.stageTransition();

    const tempPromise = this.runAfterDelay(time);
    this.processes["currentCycleProcess"] = tempPromise;
    // console.log(this.processes["currentCycleProcess"]);
    this.processes["currentCycleProcess"]
      .then((result) => {
        // console.log(result);
        this.emit("cycle");
      })
      .catch((error) => {
        console.error(error.message); // Output: Promise canceled
      });

    if (
      this.cycleIndex ==
      this.tData["networks"][this.networkName]["order"].length - 1
    ) {
      this.cycleIndex = 0;
      //   console.log("RESET " + this.cycleIndex);
    } else {
      this.cycleIndex += 1;
      //   console.log("Increment " + this.cycleIndex);
    }
  }

  stopCurrentCycle() {
    this.processes["currentCycleProcess"].cancel();
    this.cycleEnable = false;
    // console.log(this.processes["currentCycleProcess"])

    //should go elsewhere
    console.log("turning off turrets of currentCycleProcess");
  }

  deviceTriggerResponse(deviceInfo) {
    var scope = deviceInfo["broadcast"]["entityChanged"];
    var value = scope["payload"]["value"];
    var entityId = scope["entityId"];
    //is it hasTarget? is it HBF?
    // console.log("DEVICE TRIGGER RESPONSE");

    if (value) {
      this.deviceOnResponse(scope, value, entityId);
    } else {
      this.deviceOffResponse(scope, value, entityId);
    }
    // console.log(deviceInfo);
  }

  deviceOnResponse(scope, value, entityId) {
    // console.log("DEVICE TRIGGER RESPONSE - ON");
    if (this.hbfHash[entityId]) {
      this.HbfOnResponse(scope, value, entityId);
    } else if (this.hasTargetHash[entityId]) {
      this.hasTargetOnResponse(scope, value, entityId);
    }
  }

  deviceOffResponse(scope, value, entityId) {
    // console.log("DEVICE TRIGGER RESPONSE - OFF");
    if (this.hbfHash[entityId]) {
      this.HbfOffResponse(scope, value, entityId);
    } else if (this.hasTargetHash[entityId]) {
      this.hasTargetOffResponse(scope, value, entityId);
    }
  }

  HbfOnResponse(scope, value, entityId) {
    console.log("DEVICE TRIGGER - HBF ON");
    var groupRef = this.hbfHash[entityId];
    var priority = this.nData["groups"][groupRef]["priority"];
    // var switchId= this.nData['groups'][groupRef]['switch']

    this.emergencyQueue.addElement(entityId, priority);
    this.evalStage();
  }

  HbfOffResponse(scope, value, entityId) {
    console.log("DEVICE TRIGGER - HBF OFF");
    // var groupRef = this.hbfHash[entityId];
    // var priority = this.nData["groups"][groupRef]["priority"];
    // // var switchId= this.nData['groups'][groupRef]['switch'
    this.emergencyQueue.removeElement(entityId);
    console.log(this.emergencyQueue.pq);
    this.evalStage();
  }

  hasTargetOnResponse(scope, value, entityId) {
    console.log("DEVICE TRIGGER - TARGET ON");
    if (!this.pausedOnTarget && this.emergencyQueue.pq.length == 0) {
      var groupRef = this.hasTargetHash[entityId];
      this.pausedOnTarget = true;
      this.stopCurrentCycle();
    }
  }

  hasTargetOffResponse(scope, value, entityId) {
    console.log("DEVICE TRIGGER - TARGET OFF");
    if (this.pausedOnTarget) {
      this.pausedOnTarget = false;
      this.evalStage();
    }
  }

  evalStage() {
    this.emergencyQueue.peek();
    console.log("=========evalStart:", this.emergencyQueue.pq);
    if (this.emergencyQueue.pq.length == 0 && !this.cycleEnable) {
      this.cycleEnable = true;
      this.cycle(true);
    } else if (this.emergencyQueue.pq.length > 0) {
      this.stopCurrentCycle();
      var alarmId = this.emergencyQueue.peek()[0];
      var prioGroup = this.alarmToGroup(alarmId);
      this.nextGroups[prioGroup] = this.nData["groups"][prioGroup]["size"];
      this.stageTransition();
    }
    
  }

  alarmToGroup(alarmId) {
    var group = this.hbfHash[alarmId];
    if (group == undefined) {
      group = this.hasTargetHash[alarmId];
    }
    return group;
  }

  stageTransition() {
    console.log("--Stage Transition--");
    var transitionTally = {};

    for (let group in this.currentGroups) {
      if (this.currentGroups.hasOwnProperty(group)) {
        //the if here: not needed now but small addition for potential future proofing
        if (transitionTally[group]) {
          transitionTally[group] = transitionTally[group] - 1;
        } else {
          transitionTally[group] = -1;
        }
      }
    }

    for (let group in this.nextGroups) {
      if (this.nextGroups.hasOwnProperty(group)) {
        //the if here: not needed now but small addition for potential future proofing
        if (transitionTally[group]) {
          transitionTally[group] = transitionTally[group] + 1;
        } else {
          transitionTally[group] = 1;
        }
      }
    }

    console.log(
      `from ${JSON.stringify(this.currentGroups)} to ${JSON.stringify(
        this.nextGroups
      )}`
    );
    console.log(transitionTally);
    // console.log("_-_-_")

    this.currentGroups = {};
    this.nextGroups = {};
    // console.log(transitionTally,"TEST")
    for (let group in transitionTally) {
      // console.log(transitionTally.hasOwnProperty(group),group)
      if (transitionTally.hasOwnProperty(group)) {
        // console.log(group,transitionTally[group])
        //the if here: not needed now but small addition for potential future proofing
        if (transitionTally[group] < 0) {
          console.log(`TURNING OFF ${group}`);
          rr.regSetDevice(this.vp, this.nData["groups"][group]["switch"], 0);
        } else if (transitionTally[group] > 0) {
          console.log(`TURNING ON ${group}`);
          rr.regSetDevice(this.vp, this.nData["groups"][group]["switch"], 1);
          this.currentGroups[group] = this.nData["groups"][group]["size"];
        } else {
          console.log(`Remains unchanged ${group}`);
          this.currentGroups[group] = this.nData["groups"][group]["size"];
        }
      }
    }
  }
}

module.exports = turretNetwork;
