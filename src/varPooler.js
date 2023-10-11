const RustPlus = require("@liamcottle/rustplus.js");
const curryPot = require("./curryPot.js");
const throttler = require("./throttler.js");
const tokenTracker = require("./tokenTracker.js");
var helpers = require("./helpers.js");
var fs = require("fs");
const Camera = require("@liamcottle/rustplus.js/camera.js");
const MyCamera = require("./MyCamera.js");
const CamHandler = require("./CamHandler.js");

class varPooler {
  constructor() {
    this.startup();
  }
  setDiscordClient(client) {
    this.client = client;
  }
  startup() {
    // console.log("VARPOOLER STARTUP");
    this.fs = require("fs");
    this.dataName = "./src/configs/data.json";
    this.dat = require("./configs/data.json");
    this.perms = require("./configs/perms.json");
    this.itemDB = require("./configs/itemDB.json");
    this.vendingIgnore = require("./configs/vendingIgnore.json");
    this.vendingSearch = require("./configs/vendingSearch.json");
    this.stash = require("./configs/stash.json");
    this.vendingSpecial = require("./configs/vendingSpecial.json");
    this.helpers = require("./helpers.js");
    this.rpf = require("./rustPlusFeatures.js");


    this.throt = new throttler(this);
    this.livePulsers = {};
    if (this.dat.pulserBank == undefined) {
      this.dat.pulserBank = {};
      helpers.jsonUpdate(fs, this.dataName, this.dat);
    }
    if (this.dat.pulserIdToName == undefined) {
      this.dat.pulserIdToName = {};
      helpers.jsonUpdate(fs, this.dataName, this.dat);
    }
    if (this.dat.brokenDevices == undefined) {
      this.dat.brokenDevices = {};
      helpers.jsonUpdate(fs, this.dataName, this.dat);
    }

    if (this.dat.SCQBank == undefined) {
      this.dat.SCQBank = {};
      helpers.jsonUpdate(fs, this.dataName, this.dat);
      2;
    }

    if (this.dat.devices[this.dat.servers[this.dat.current].name] == undefined) {
      this.dat.devices[this.dat.servers[this.dat.current].name] = {};
    }

    if (
      this.dat.devices[this.dat.servers[this.dat.current].name].deviceHash ==
      undefined
    ) {
      this.dat.devices[this.dat.servers[this.dat.current].name].deviceHash = {};
    }

    if (this.liveSequences == undefined) {
      this.liveSequences = {};
    }

    if (this.dat.camIgnore == undefined) {
      this.dat.camIgnore = {};
    }

    this.dcheckValList = {};
    if (this.dat.destroCheckNameList == undefined) {
      this.dat.destroCheckNameList = {};
    } else {
      for (var key in this.dat.destroCheckNameList) {
        // var dcheck = this.dat.destroChecks[key];
        this.dcheckValList[key] = 0;
      }
    }

    if (this.dat.destroSenders == undefined) {
      this.dat.destroSenders = {};
    }

    if (this.dat.destroReceivers == undefined) {
      this.dat.destroReceivers = {};
    }

    this.mapScan = { val: false };
    this.mapFirst = { val: true };
    this.vendingInterval = { r: 5000 };
    this.isDisconnected = { v: false, repeater: 0, time: new Date().getTime() };

    try {
      this.vendingDB = require("./configs/vendingMachine.json");
    } catch (e) {
      this.vendingDB = {};
    }

    this.serv = this.dat.servers[this.dat.current];

    console.log(
      "Rust+ bound to: " +
        this.serv.ip +
        " " +
        this.serv.port +
        " " +
        this.serv.playerId +
        " " +
        this.serv.playerToken
    );
    this.rustplus = new RustPlus(
      this.serv.ip,
      this.serv.port,
      this.serv.playerId,
      this.serv.playerToken
    );

    this.camHandler = new CamHandler(this);

    this.registeredChannel = { v: null };
    this.vendingChannel = { v: null };
    this.fcmChannel = { v: null };
    this.raidChannel = { v: null };
    this.generalChannel = { v: null };
  }

  async wrapGetMapMarkers() {
    console.log("============= IN1");
    var x = null;
    console.log("============= IN1,5t");
    this.rustplus.getMapMarkers((rustMsg) => {
      console.log("============= IN2");
      x = JSON.parse(JSON.stringify(rustMsg).replaceAll("type", "dType"));
      console.log("============= IN3");
      console.log(x);
    });
    console.log("BEFORE");
    await this.helpers.delay(5000);
    return x;
  }

  async writeDat() {
    await helpers.delay(1000);
    helpers.jsonUpdate(fs, this.dataName, this.dat);
  }
}
module.exports = varPooler;
