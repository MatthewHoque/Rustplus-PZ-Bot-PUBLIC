const varPooler = require("./varPooler.js");
const helpers = require("./helpers.js");
const fs = require("fs");
const tokenTracker = require("./tokenTracker.js");
const curryPot = require("./curryPot.js");

class reqReg {
  static regDevice(fcm, vp, message) {
    var curryCall = new curryPot(vp.rpf.deviceRegister, null, fcm, vp, message);
    curryCall.setVars(50, 1, 0);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static promoteLead(vp, message) {
    var curryCall = new curryPot(vp.rpf.promoteToLeader, null, vp, message);
    curryCall.setVars(50, 1, 0);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static promoteLeadIntegrated(vp, message) {
    var curryCall = new curryPot(vp.rpf.promoteToLeaderIntegrated, null, vp, interaction);
    curryCall.setVars(50, 1, 0);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }


  static regSetDevice(vp, deviceId,onOff) {
    var curryCall = new curryPot(vp.rpf.wrapToggleDevice,null,vp,deviceId,onOff);
    curryCall.setVars(1, 1, 0);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  //will be unused
  static regAutoDeviceRegister(vp, deviceId) {
    var curryCall = new curryPot(vp.rpf.autoDeviceRegister, null, vp, deviceId);
    curryCall.setVars(50, 1, 0);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static regSearch(vp, message) {
    var args = message.content.split(" ");
    var curryCall = new curryPot(
      vp.rpf.vendSearch,
      null,
      vp,
      vp.rustplus,
      args[2],
      args[1],
      vp.vendingChannel,
      vp.dat
    );
    curryCall.setVars(50, 1, 0);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static regStash(vp, message, discordMsg) {
    console.log(message);
    var curryCall = new curryPot(
      vp.rpf.stashControl,
      null,
      vp,
      message,
      discordMsg
    );
    curryCall.setVars(30, 1, 0);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static regPop(vp, message) {
    var postCallCurry = new curryPot(
      async (vp, releaseAmount) => {
        await helpers.delay(1000);
        // console.log("RELEASING DEBUG MESSAGE REGGAMETIME");
        vp.throt.tracker.useTokens(releaseAmount);
        vp.throt.tracker.releaseTokens(releaseAmount);
      },
      null,
      vp,
      2
    );

    var curryCall = new curryPot(vp.rpf.gamePop, postCallCurry, vp, message);
    curryCall.setVars(100, 1, 2);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static regGameTime(vp, message) {
    var postCallCurry = new curryPot(
      async (vp, releaseAmount) => {
        await helpers.delay(1000);
        // console.log("RELEASING DEBUG MESSAGE REGGAMETIME");
        vp.throt.tracker.useTokens(releaseAmount);
        vp.throt.tracker.releaseTokens(releaseAmount);
      },
      null,
      vp,
      2
    );

    var curryCall = new curryPot(vp.rpf.gameTime, postCallCurry, vp, message);
    curryCall.setVars(100, 1, 2);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static regPulserTrigger(vp, pulser) {
    var cost = 1;
    var release = 1;
    var reserve = 1;
    if (pulser.typeCall == -1) {
      cost = 2;
      release = 2;
      reserve = 2;
    }

    var postCallCurry = new curryPot(
      async (vp, pulser, releaseAmount) => {
        // console.log(`waiting ${pulser.loopDelay-pulser.callbackDelay} B`)
        await helpers.delay(+pulser.loopDelay - +pulser.callbackDelay);
        if (pulser.typeCall != -1) {
          vp.rpf.wrapToggleDevice(vp, pulser.deviceId, pulser.typePostCall);
          // console.log("non quickpulse pulser called")
        } else {
          // console.log("quickpulse pulser called")
          vp.rpf.wrapToggleDeviceQuickPulse(
            vp,
            pulser.deviceId,
            pulser.typePostCall
          );
        }
        vp.throt.tracker.useTokens(releaseAmount);
        vp.throt.tracker.releaseTokens(releaseAmount);
      },
      null,
      vp,
      pulser,
      1 //release 1 token
    );

    var firstFunc =
      pulser.typeCall != -1
        ? vp.rpf.wrapToggleDevice
        : vp.rpf.wrapToggleDeviceQuickPulse;

    var curryCall = new curryPot(
      firstFunc,
      postCallCurry,
      vp,
      pulser.deviceId,
      pulser.typeCall
    );

    curryCall.setVars(pulser.priority, 1, 1);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static regLoadDeviceSingle(vp, key) {
    var curryCall = new curryPot(vp.rpf.loadDeviceSingle, null, key, vp);
    curryCall.setVars(10, 1, 0);
    vp.throt.queueReq(curryCall);
    vp.throt.processQueueLoop();
  }

  static async regMapMarkerScanLoop(vp) {
    while (true) {
      var curryCall = new curryPot(
        vp.rpf.mapMarkerScan,
        null,
        vp.client,
        vp.rustplus,
        vp.dat,
        vp.vendingInterval,
        vp.vendingChannel,
        vp.vendingSearch,
        vp.vendingIgnore,
        vp.vendingSpecial,
        vp.vendingDB,
        vp.itemDB,
        vp.isDisconnected,
        vp.mapFirst,
        vp
      );
      curryCall.setVars(150, 1, 0);
      vp.throt.queueReq(curryCall);
      vp.throt.processQueueLoop();
      await helpers.delay(vp.vendingInterval.r);
    }
  }
}

module.exports = reqReg;
