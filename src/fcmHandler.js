const rr = require("./reqReg.js");
const { EventEmitter } = require("events");
const path = require("path");
const { register, listen } = require("push-receiver");
var fs = require("fs");
var helpers = require("./helpers.js");

class fcmHandler extends EventEmitter {
  constructor(vp) {
    super();
    this.vp = vp;
    this.isStarted=false
  }

  //from RustPlus Library
  //https://github.com/liamcottle/rustplus.js/blob/master/cli/index.js

  async startup() {
    this.isStarted=true
    await helpers.delay(10000)
    await this.fcmListen();
  }

  lastPairRename(message){
    var args = message.content.split(" ");
    //vp.dat.devices[vp.dat.servers[vp.dat.current].name].deviceHash
    message.reply(`Renaming ${this.vp.dat.devices[this.vp.dat.servers[this.vp.dat.current].name].deviceHash[this.lastPair["entityId"]].name} to ${args[1]}`)
    this.vp.dat.devices[this.vp.dat.servers[this.vp.dat.current].name].deviceHash[this.lastPair["entityId"]].name=args[1]
    helpers.jsonUpdate(fs, this.vp.dataName, this.vp.dat);
  }

  fcmReceived(vp,body) {
    if (!body.hasOwnProperty("type")) {
      return;
    }

    if (body["type"] == "entity") {
      this.lastPair = body;
      const channel = vp.client.channels.cache.get(this.vp.fcmChannel.v);
      channel.send(`FCM Received deviceID ready to pair: ${body["entityId"]}. !device name `)
      // rr.regAutoDeviceRegister(vp, body["entityId"]);
    }
  }

  async fcmListen() {
    // parse command line arg

    // read config file

    const configFile = path.join(process.cwd(), "src", "rustplus.config.json");
    // console.log("============");
    // console.log(configFile);
    // console.log("============");
    const config = this.readConfig(configFile);
    // console.log("===");
    // console.log(config);
    // console.log("===");
    

    // make sure fcm credentials are in config
    if (!config.fcm_credentials) {
      console.error(
        "FCM Credentials missing. Please run `fcm-register` first."
      );
      process.exit(1);
      return;
    }

    console.log("Listening for FCM Notifications");
    var fcmClient = await listen(
      config.fcm_credentials,
      ({ notification, persistentId }) => {
        // parse notification body
        const body = JSON.parse(notification.data.body);

        // generate timestamp
        const timestamp = new Date().toLocaleString();

        // log timestamp the notification was received (in green colour)
        console.log(
          "\x1b[32m%s\x1b[0m",
          `[${timestamp}] Notification Received`
        );

        // log notification body
        console.log(body);
        this.fcmReceived(this.vp,body);
      }
    );
  }

  //from RustPlus Library
  //https://github.com/liamcottle/rustplus.js/blob/master/cli/index.js
  readConfig(configFile) {
    // console.log("TRYING PARSE " + configFile);
    try {
      return JSON.parse(fs.readFileSync(configFile));
    } catch (err) {
      //   console.log("ERRORRRRR \n" + err);
      return {};
    }
  }
}

module.exports = fcmHandler;
