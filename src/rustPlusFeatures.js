var helpers = require("./helpers.js");
var fs = require("fs");
const rr = require("./reqReg.js");
const Pulser = require("./Pulser.js");
const Sequencer = require("./MySequencer.js");

function checkSpecialVending(
  data,
  itemDB,
  vendingSpecial,
  mapFirst,
  marker,
  client
) {
  if (vendingSpecial.hasOwnProperty(marker.id)) {
    if (marker.sellOrders != undefined) {
      marker.sellOrders.forEach((order) => {
        var itemBp = order.itemIsBlueprint ? "BP " : "";
        var currencyBP = order.currencyIsBlueprint ? "BP " : "";
        var itemName = itemDB.hasOwnProperty(order.itemId)
          ? itemDB[order.itemId].name
          : order.itemId;
        var currencyName = itemDB.hasOwnProperty(order.currencyId)
          ? itemDB[order.currencyId].name
          : order.currencyId;

        var item = null;
        if (
          vendingSpecial[marker.id].hasOwnProperty(order.currencyId) &&
          vendingSpecial[marker.id][order.currencyId].vType == "buying"
        ) {
          item = order.currencyId;
        } else if (
          vendingSpecial[marker.id].hasOwnProperty(order.itemId) &&
          vendingSpecial[marker.id][order.itemId].vType == "selling"
        ) {
          item = order.itemId;
        }

        var notifyFlag = false;
        if (item != null) {
          let curTime = new Date();
          var cooldownCheck = false;
          if (
            vendingSpecial[marker.id][item]["lastMessage"] == undefined ||
            (vendingSpecial[marker.id][item]["lastMessage"] != undefined &&
              curTime.getTime() -
                vendingSpecial[marker.id][item]["lastMessage"] >=
                vendingSpecial[marker.id][item]["cooldown"])
          ) {
            cooldownCheck = true;
          }

          if (cooldownCheck) {
            if (
              order.amountInStock >=
                vendingSpecial[marker.id][item].orderCount &&
              vendingSpecial[marker.id][item].direction == ">"
            ) {
              notifyFlag = true;
            } else if (
              order.amountInStock <=
                vendingSpecial[marker.id][item].orderCount &&
              vendingSpecial[marker.id][item].direction == "<"
            ) {
              notifyFlag = true;
            } else if (
              order.amountInStock ==
                vendingSpecial[marker.id][item].orderCount &&
              vendingSpecial[marker.id][item].direction == "="
            ) {
              notifyFlag = true;
            }

            if (notifyFlag && !mapFirst.val) {
              const channel = client.channels.cache.get(
                vendingSpecial[marker.id][item].channel
              );
              let date_ob = new Date();
              vendingSpecial[marker.id][item]["lastMessage"] =
                date_ob.getTime();

              helpers.jsonUpdate(
                fs,
                "./src/configs/vendingSpecial.json",
                vendingSpecial
              );
              channel.send(
                `<@${
                  vendingSpecial[marker.id][item]["user"]
                }> :gear: VM ORDER SPECIAL ** ${
                  marker.name
                } ** at ${helpers.rustCoords(
                  marker.x,
                  marker.y,
                  data.servers[data.current].mapSize,
                  data.servers[data.current].squaresX,
                  data.servers[data.current].squaresY
                )} \n[${
                  marker.id
                }]\n:green_book: New Orders:\`\`\`${helpers.orderParser(
                  [order],
                  itemDB
                )}\`\`\`\n${helpers.ts(2)}`
              );

              // if (vendingSpecial[marker.id][item]["tts"] != "null") {
              //   // channel.send(vendingSpecial[marker.id][item]["tts"], {tts: true});
              //   channel.send({ content: `FERTILIZER ${1}`, tts: true });
              // }
            }
          }
        }
      });
    }
  }
}
module.exports.checkSpecialVending = checkSpecialVending;

function registerSpecialVending(message, vendingSpecial) {
  var args = message.content.split(" ");

  if (!vendingSpecial.hasOwnProperty(args[1])) {
    vendingSpecial[args[1]] = {};
  }
  vendingSpecial[args[1]][args[3]] = {
    vType: args[2],
    channel: message.channelId,
    direction: args[4],
    orderCount: args[5],
    cooldown: args[6],
    user: message.author.id,
  };

  //   message.reply("Vending Special registred",{tts:true})

  helpers.jsonUpdate(fs, "./src/configs/vendingSpecial.json", vendingSpecial);
}
module.exports.registerSpecialVending = registerSpecialVending;

async function mapMarkerScan(
  client,
  rustplus,
  data,
  vendingInterval,
  vendingChannel,
  vendingSearch,
  vendingIgnore,
  vendingSpecial,
  vendingDB,
  itemDB,
  isDisconnected,
  mapFirst,
  vp
) {
  // console.log(vendingInterval, "VENDING INTERVAL INSIDE");
  // console.log(vendingChannel, "vendingChannel INSIDE");

  // while (!isDisconnected["v"]) {
  // while (true) {
  //console.log("debug called mapmarker",vendingInterval.r)
  //console.log(`MAP SCAN VAR ${JSON.stringify(mapScan)}`)
  rustplus.getMapMarkers((rustMsg) => {
    var repRustMsg = JSON.parse(
      JSON.stringify(rustMsg).replaceAll("type", "dType")
    );
    // console.log(repRustMsg)
    // console.log("map result: " + JSON.stringify(repRustMsg));
    var markers = repRustMsg.response.mapMarkers.markers;

    //var oldMarkers=vendingDB
    var currentMarkers = {};
    markers.forEach((marker) => {
      currentMarkers[marker.id] = marker;
    });

    // isDisconnected["repeater"] += 1;
    // console.log(isDisconnected["time"],new Date().getTime()-isDisconnected["time"]);
    if (new Date().getTime() - isDisconnected["time"] > 120000) {
      isDisconnected["time"] = new Date().getTime();
      console.log(
        helpers.ts(2) + " MrkrCnt: " + JSON.stringify(markers.length)
      );
    }

    helpers.jsonUpdate(
      fs,
      "src/configs/testCurrentMarkers.json",
      currentMarkers
    );
    helpers.jsonUpdate(fs, "src/configs/testVendDB.json", vendingDB);

    if (!mapFirst["val"]) {
      for (const [key, marker] of Object.entries(vendingDB)) {
        if (
          marker.dType == "VendingMachine" &&
          !currentMarkers.hasOwnProperty(key)
        ) {
          if (vendingChannel.v != null && !mapFirst.val) {
            const channel = client.channels.cache.get(vendingChannel.v);
            channel.send(
              `:spy: VM **${marker.name}** Removed at ${helpers.rustCoords(
                marker.x,
                marker.y,
                data.servers[data.current].mapSize,
                data.servers[data.current].squaresX,
                data.servers[data.current].squaresY
              )}`
            );
          }
          delete vendingDB[key];
          helpers.jsonUpdate(
            fs,
            "./src/configs/vendingMachine.json",
            vendingDB
          );
        }
      }
    }

    markers.forEach((marker) => {
      if (marker.dType == "VendingMachine") {
        checkSpecialVending(
          data,
          itemDB,
          vendingSpecial,
          mapFirst,
          marker,
          client
        );

        if (vendingDB.hasOwnProperty(marker.id)) {
          //compare 2
          if (
            marker.name != vendingDB[marker.id].name &&
            !vendingIgnore.hasOwnProperty(marker.id)
          ) {
            if (vendingChannel.v != null && !mapFirst.val) {
              const channel = client.channels.cache.get(vendingChannel.v);
              channel.send(
                `VM Name Change **${vendingDB[marker.id].name}** -> **${
                  marker.name
                }** at  ${helpers.rustCoords(
                  marker.x,
                  marker.y,
                  data.servers[data.current].mapSize,
                  data.servers[data.current].squaresX,
                  data.servers[data.current].squaresY
                )}`
              );
            }

            vendingDB[marker.id].name = marker.name;
            helpers.jsonUpdate(
              fs,
              "./src/configs/vendingMachine.json",
              vendingDB
            );
          }

          if (
            JSON.stringify(marker.sellOrders) !=
              JSON.stringify(vendingDB[marker.id].sellOrders) &&
            !vendingIgnore.hasOwnProperty(marker.id)
          ) {
            if (vendingChannel.v != null && !mapFirst.val && marker.name!="Boat Vendor") {
              const channel = client.channels.cache.get(vendingChannel.v);
              channel.send(
                `:gear: VM Order Change ** ${
                  marker.name
                } ** at ${helpers.rustCoords(
                  marker.x,
                  marker.y,
                  data.servers[data.current].mapSize,
                  data.servers[data.current].squaresX,
                  data.servers[data.current].squaresY
                )} \n[${
                  marker.id
                }]\n :closed_book: Past Orders: \`\`\`${helpers.orderParser(
                  vendingDB[marker.id].sellOrders,
                  itemDB
                )}\`\`\`:green_book: New Orders:\`\`\`${helpers.orderParser(
                  marker.sellOrders,
                  itemDB
                )}\`\`\``
              );

              if (marker.sellOrders != undefined) {
                marker.sellOrders.forEach((order) => {
                  if (vendingSearch.selling.hasOwnProperty(order.itemId)) {
                    var customOrder = [order];
                    var orderText = helpers.orderParser(customOrder, itemDB);
                    // console.log(`Item being sold: ${orderText}`);
                    channel.send(`:star: Item being sold: ${orderText}`);
                  }

                  if (vendingSearch.buying.hasOwnProperty(order.currencyId)) {
                    var customOrder = [order];
                    var orderText = helpers.orderParser(customOrder, itemDB);
                    // console.log(`Item being bought: ${orderText}`);
                    channel.send(`:star: Item being bought: ${orderText}`);
                  }
                });
              }
            }
            vendingDB[marker.id].sellOrders = marker.sellOrders;
            helpers.jsonUpdate(
              fs,
              "./src/configs/vendingMachine.json",
              vendingDB
            );
          }
        } else {
          if (vendingChannel.v != null && !mapFirst.val) {
            const channel = client.channels.cache.get(vendingChannel.v);
            channel.send(
              `:convenience_store: VM placed **${
                marker.name
              }** at  ${helpers.rustCoords(
                marker.x,
                marker.y,
                data.servers[data.current].mapSize,
                data.servers[data.current].squaresX,
                data.servers[data.current].squaresY
              )}`
            );
          }
          vendingDB[marker.id] = marker;
          helpers.jsonUpdate(
            fs,
            "./src/configs/vendingMachine.json",
            vendingDB
          );
        }
      }
    });
    mapFirst["val"] = false;
  });
  // await helpers.delay(vendingInterval.r);
  // }

  // console.log("EXITED MAPMARKER LOOP");
}
module.exports.mapMarkerScan = mapMarkerScan;

async function loadDeviceSingle(key, vp) {
  console.log("loading device", key);
  vp.rustplus.getEntityInfo(key, (rustMsg) => {
    //console.log("test")
    rustMsg = JSON.parse(JSON.stringify(rustMsg).replace("type", "dType"));
    //console.log(JSON.stringify(rustMsg.response))
    if (rustMsg.response.hasOwnProperty("error")) {
      console.log("ERROR IN SUBSCRIBING DEVICE: " + JSON.stringify(rustMsg));
    } else {
      // console.log(vp)
      // console.log(vp.dat)
      vp.dat.devices[vp.dat.servers[vp.dat.current].name].deviceHash[key].resp =
        rustMsg;
      helpers.jsonUpdate(fs, vp.dataName, vp.dat);
      console.log(
        `Now listening for ${
          vp.dat.devices[vp.dat.servers[vp.dat.current].name].deviceHash[key]
            .name
        }. Type: ${rustMsg.response.entityInfo.dType}  State: ${
          rustMsg.response.entityInfo.payload.value
        }`
      );
    }
  });

  //console.log("vvv")
}
module.exports.loadDeviceSingle = loadDeviceSingle;

//deviceId deviceID true/false
async function ignoreDeviceDiscord(vp, message) {
  var args = message.content.split(" ");
  if (serverDevices.hasOwnProperty(args[1])) {
    vp.dat.devices[vp.dat.servers[vp.dat.current].name].deviceHash[args[1]][
      "ignoreDiscord"
    ] = args[2];
    vp.writeDat();
    message.reply(`Ignore value for ${args[1]} : ${args[2]}`);
  } else {
    message.reply(`No such device ${args[1]}`);
  }
}
module.exports.ignoreDeviceDiscord = ignoreDeviceDiscord;

async function loadPulsers(vp) {
  var pulsers = vp.dat.pulserBank;
  for (const [key, pulse] of Object.entries(pulsers)) {
    var message = {
      content: `x ${pulse.name} ${pulse.deviceId} ${pulse.pulseStart} ${pulse.loopDelay} ${pulse.callbackDelay} ${pulse.priority}`,
    };
    var rebuild = {
      paused: pulse.paused,
      loopCheck: pulse.loopCheck,
    };
    makePulse(vp, message, rebuild);
  }
}

async function loadSCQs(vp) {
  var SCQs = vp.dat.SCQBank;
  for (const [key, SCQ] of Object.entries(SCQs)) {
    var message = {
      // seqName cameraId falseLoopDelay priority
      content: `x ${key} ${SCQ.cameraId} ${SCQ.falseLoopDelay} ${SCQ.priority}`,
    };
    // console.log("REGISDTERING", key, SCQ.channel);
    registerSCQ(vp, message, SCQ.channel);
    await helpers.delay(500);
  }
}
// vp,
//     name,
//     deviceId,
//     pulseStart,
//     loopDelay,
//     callbackDelay,
//     priority
async function loadDevices(
  data,
  rustplus,
  client,
  registeredChannel,
  dataName,
  vp
) {
  // await helpers.delay(3000);
  console.log("Subscribing Devices");
  serverDevices = data.devices[data.servers[data.current].name].deviceHash;
  for (const [key, value] of Object.entries(serverDevices)) {
    rr.regLoadDeviceSingle(vp, key);
    // loadDeviceSingle(rustplus,key,data,dataName)
    await helpers.delay(1000);
  }
  if (registeredChannel.v != null) {
    var channel = client.channels.cache.get(registeredChannel.v);
    channel.send({ content: "ALL DEVICES SUBSCRIBED", tts: false });
  }
  console.log("ALL DEVICES SUBSCRIBED");

  ready = true;
  loadPulsers(vp);
  loadSCQs(vp);
}
module.exports.loadDevices = loadDevices;

async function vendSearch(vp, rustplus, item, action, vendingChannel, data) {
  rustplus.getMapMarkers((rustMsg) => {
    var repRustMsg = JSON.parse(
      JSON.stringify(rustMsg).replaceAll("type", "dType")
    );
    // console.log("map result: " + JSON.stringify(repRustMsg));
    var markers = repRustMsg.response.mapMarkers.markers;
    var idType = "itemId";
    if (action == "buying") {
      idType = "currencyId";
    }
    markers.forEach((marker) => {
      if (marker.dType == "VendingMachine" && marker.sellOrders != undefined) {
        marker.sellOrders.forEach((order) => {
          if (order[idType] == item) {
            if (vendingChannel.v != null) {
              var channel = vp.client.channels.cache.get(vendingChannel.v);
              var customOrder = [order];
              channel.send(
                `**${marker.name}** ${helpers.rustCoords(
                  marker.x,
                  marker.y,
                  data.servers[data.current].mapSize,
                  data.servers[data.current].squaresX,
                  data.servers[data.current].squaresY
                )} \`\`\`${helpers.orderParser(customOrder, vp.itemDB)}\`\`\``
              );
            }
          }
        });
      }
    });
  });
}
module.exports.vendSearch = vendSearch;

async function autoDeviceRegister(vp, deviceId) {
  //const channel = client.channels.cache.get(registeredChannel);
  vp.rustplus.getEntityInfo(deviceId, (rustMsg) => {
    rustMsg = JSON.parse(JSON.stringify(rustMsg).replace("type", "dType"));

    if (rustMsg.response.hasOwnProperty("error")) {
      console.log(
        JSON.stringify(
          "ERROR IN SUBSCRIBING DEVICE: " + JSON.stringify(rustMsg)
        )
      );
      if (vp.fcmChannel.v != null) {
        var channel = vp.client.channels.cache.get(vp.fcmChannel.v);
        channel.send(
          JSON.stringify(
            "ERROR IN SUBSCRIBING DEVICE: " + JSON.stringify(rustMsg)
          ),
          { tts: true }
        );
      }
    } else {
      vp.dat.devices[vp.dat.servers[vp.dat.current].name].deviceHash[deviceId] =
        {
          resp: rustMsg,
          name: deviceId,
          channel: vp.fcmChannel.v,
        };
      helpers.jsonUpdate(fs, vp.dataName, vp.dat);
      if (vp.fcmChannel.v != null) {
        var channel = vp.client.channels.cache.get(vp.fcmChannel.v);
        channel.send(
          `:signal_strength: FCM Now listening for ${deviceId}. Type: ${rustMsg.response.entityInfo.dType}  State: ${rustMsg.response.entityInfo.payload.value}`,
          { tts: true }
        );
      }
    }
  });
}
module.exports.autoDeviceRegister = autoDeviceRegister;

async function deviceRegister(fcm, vp, message) {
  var channelId = "";
  var args = message.content.split(" ");
  var deviceName, deviceId;
  var deviceTTS;

  if (args[0] == "!device") {
    channelId = message.channelId;
  } else if (args[0] == "!rraid") {
    channelId = vp.raidChannel.v;
  } else if (args[0] == "!rgeneral") {
    channelId = vp.generalChannel.v;
  }

  if (args.length == 3) {
    deviceId = fcm.lastPair["entityId"];
    deviceName = args[1];
    deviceTTS = args[2];
  } else {
    deviceId = args[1];
    deviceName = args[2];
    deviceTTS = args[3];
  }
  //"notts" for no tts

  vp.rustplus.getEntityInfo(deviceId, (rustMsg) => {
    rustMsg = JSON.parse(JSON.stringify(rustMsg).replace("type", "dType"));
    if (rustMsg.response.hasOwnProperty("error")) {
      console.log(
        JSON.stringify(
          "ERROR IN SUBSCRIBING DEVICE: " + JSON.stringify(rustMsg)
        )
      );
      message.reply(
        JSON.stringify(
          "ERROR IN SUBSCRIBING DEVICE: " + JSON.stringify(rustMsg)
        )
      );
    } else {
      vp.dat.devices[vp.dat.servers[vp.dat.current].name].deviceHash[deviceId] =
        {
          resp: rustMsg,
          name: deviceName,
          channel: message.channelId,
          tts: deviceTTS,
        };
      helpers.jsonUpdate(fs, vp.dataName, vp.dat);
      message.reply(
        `Now listening for ${deviceName}(${deviceId}). Type: ${rustMsg.response.entityInfo.dType}  State: ${rustMsg.response.entityInfo.payload.value}`
      );
    }
  });
}
module.exports.deviceRegister = deviceRegister;

async function mapScanSwitch(vp, message) {
  var args = message.content.split(" ");
  if (args[1] == "on") {
    vp.mapScan.val = true;
    message.reply("Map scan turned on");
  } else if (args[1] == "off") {
    vp.mapScan.val = false;
    message.reply("Map scan turned off");
  }
}
module.exports.mapScanSwitch = mapScanSwitch;

async function stashControl(vp, message, discMsg) {
  var args = message.content.split(" ");
  var current = undefined;
  vp.rustplus.getMapMarkers((rustMsg) => {
    var repRustMsg = JSON.parse(
      JSON.stringify(rustMsg).replaceAll("type", "dType")
    );
    var chosenId = vp.stash.steamId;
    var ingame = false;
    var discordId = undefined;

    if (args[0] == "1sh") {
      console.log("ARTIFICIAL");
      chosenId = args[2];
      ingame = true;
    } else {
      console.log(`args=========== ${args}`);
      chosenId = args[args.length - 1];
      discordId = args[args.length - 2];
    }

    var markers = repRustMsg.response.mapMarkers.markers;
    markers.forEach((marker) => {
      if (marker.dType == "Player") {
        console.log(
          `Chose Id= ${chosenId}\nPlayer Marker Id= ${marker.steamId},`
        );
        if (marker.steamId == chosenId) {
          current = JSON.parse(JSON.stringify(marker));
        }
      }
    });

    console.log(`current check ====\n${JSON.stringify(current)}\n=====`);
    if (current != undefined) {
      if (args.length == 4 && !ingame) {
        if (vp.stash.hasOwnProperty(args[1])) {
          discMsg.reply(
            `X: ${helpers.round(current.x, 3)}     Y: ${helpers.round(
              current.y,
              3
            )}
              \ndX ${
                -1 * helpers.round(current.x - vp.stash[args[1]].x, 3)
              }      dY ${
              -1 * helpers.round(current.y - vp.stash[args[1]].y, 3)
            }`
          );
        } else {
          message.reply("No such stash exists");
        }
      } else if (args[1] == "add" && !ingame) {
        vp.stash[args[2]] = current;
        console.log(args[2]);
        console.log(JSON.stringify(vp.stash));
        helpers.jsonUpdate(fs, "./src/configs/stash.json", vp.stash);
      } else if (ingame) {
        current.author = args[3];
        current.authorId = args[2];
        console.log(current);
        vp.stash[args[1]] = current;
        helpers.jsonUpdate(fs, "./src/configs/stash.json", vp.stash);
      }
      // else{
      // report effor
      // }
    } else {
      console.log(`Error: current = undefined`);
    }

    //rustMsg=JSON.parse(JSON.stringify(rustMsg).replace("type","dType"))
    // console.log(JSON.stringify(rustMsg));
    // message.reply(`Now listening for ${args[2]}. Type: ${rustMsg.response.entityInfo.dType}  State: ${rustMsg.response.entityInfo.payload.value}`)
  });

  //console.log("vending",JSON.stringify(vendingInterval))

  //console.log("vending",JSON.stringify(vendingInterval))
}
module.exports.stashControl = stashControl;

async function gameTime(vp) {
  vp.rustplus.getTime((message) => {
    console.log("getTime result: " + JSON.stringify(message));
    var servTime = message.response.time;
    var nextSunset = helpers.timeUntil(24, servTime.time, servTime.sunset);
    var nextSunrise = helpers.timeUntil(24, servTime.time, servTime.sunrise);

    var sunsetInMinutes = helpers.rustMinutes(
      nextSunset,
      servTime.dayLengthMinutes
    );
    var sunriseInMinutes = helpers.rustMinutes(
      nextSunrise,
      servTime.dayLengthMinutes
    );

    //var minMins=min(sunsetInMinutes,sunriseInMinutes)

    // ready to send requests
    //
    var time =
      sunriseInMinutes < sunsetInMinutes ? sunriseInMinutes : sunsetInMinutes;
    var typeSun = sunriseInMinutes < sunsetInMinutes ? `Sunrise` : `Sunset`;
    vp.rustplus.sendTeamMessage(
      `${typeSun}: ${Math.floor(time)}m ${Math.floor(
        (time - Math.floor(time)) * 60
      )}s. (${JSON.stringify(helpers.roundNumbers(message.response.time))})`
    );
    console.log(
      helpers.ts(1) +
        " Sunrise: " +
        helpers.round(sunriseInMinutes, 2) +
        " | Sunset: " +
        helpers.round(sunsetInMinutes, 2)
    );
  });
}
module.exports.gameTime = gameTime;

async function gamePop(vp, message) {
  vp.rustplus.getInfo((message) => {
    var popInfo = message.response.info;

    //console.log("getInfo result: " + JSON.stringify(message));
    vp.rustplus.sendTeamMessage(
      "Players: " +
        popInfo.players +
        " / " +
        popInfo.maxPlayers +
        "  |  Queue: " +
        popInfo.queuedPlayers
    );
    console.log(
      "Players: " +
        popInfo.players +
        " / " +
        popInfo.maxPlayers +
        "  |  Queue: " +
        popInfo.queuedPlayers
    );
    const channel = vp.client.channels.cache.get(vp.registeredChannel.v);
    channel.send(
      "Players: " +
        popInfo.players +
        " / " +
        popInfo.maxPlayers +
        "  |  Queue: " +
        popInfo.queuedPlayers
    );
  });
}
module.exports.gamePop = gamePop;

async function handleBrokenPulser(vp, deviceId, message) {
  if (
    message != undefined &&
    message.response != undefined &&
    message.response.error != undefined &&
    message.response.error.error == "not_found"
  ) {
    vp.dat.brokenDevices[deviceId] = true;
    for (const [key, value] of Object.entries(
      vp.dat.pulserIdToName[deviceId]
    )) {
      console.log(`Pulser broken ${key} ... pausing`);
      vp.livePulsers[key].pause();
    }
  }
}
module.exports.handleBrokenPulser = handleBrokenPulser;

async function wrapToggleDevice(vp, deviceId, onOff) {
  if (onOff == 1) {
    vp.rustplus.turnSmartSwitchOn(deviceId, (message) => {
      // console.log("turnSmartSwitchOn result: " + JSON.stringify(message));
      handleBrokenPulser(vp, deviceId, message);
    });
  } else {
    vp.rustplus.turnSmartSwitchOff(deviceId, (message) => {
      // console.log("turnSmartSwitchOff result: " + JSON.stringify(message));
      handleBrokenPulser(vp, deviceId, message);
    });
  }
}
module.exports.wrapToggleDevice = wrapToggleDevice;

async function wrapToggleDeviceQuickPulse(vp, deviceId, onOff) {
  vp.rustplus.turnSmartSwitchOn(deviceId, (message) => {
    // console.log("turnSmartSwitchOn result: " + JSON.stringify(message));
    handleBrokenPulser(vp, deviceId, message);
  });
  await helpers.delay(200);
  vp.rustplus.turnSmartSwitchOff(deviceId, (message) => {
    // console.log("turnSmartSwitchOff result: " + JSON.stringify(message));
    handleBrokenPulser(vp, deviceId, message);
  });
}
module.exports.wrapToggleDeviceQuickPulse = wrapToggleDeviceQuickPulse;

async function makePulse(vp, message, rebuild) {
  var args = message.content.split(" ");
  //!pulser edit oldName newName deviceId pulseStart loopDelay callbackDelay priority

  if (args[1] == "edit") {
    if (vp.livePulsers.hasOwnProperty(args[2])) {
      vp.livePulsers[args[2]].processArgs(args);
    } else {
      message.reply(`Could not find pulser ${args[2]}`);
    }
  } else if (args[1] == "stop" || args[1] == "kill") {
    if (vp.livePulsers.hasOwnProperty(args[2])) {
      await vp.livePulsers[args[2]].stop();
      vp.livePulsers[args[2]] = undefined;
      vp.writeDat();
    } else {
      message.reply(`Could not find pulser ${args[1]}`);
    }
  } else {
    var pulser = new Pulser(
      vp,
      args[1], // name,
      args[2], // deviceId,
      args[3], // pulseStart,
      args[4], // loopDelay,
      args[5], // callbackDelay,
      args[6] // priority
    );
    if (rebuild != undefined) {
      pulser.rebuildPulse(rebuild);
    }
    vp.livePulsers[args[1]] = pulser;
    pulser.start();
    //name, deviceId, pulseStart, loopDelay, callbackDelay;
  }
}
module.exports.makePulse = makePulse;
// async function registerLastPairedFCM(fcm, vp, message) {

//scq seqName cameraId falseLoopDelay priority
async function registerSCQ(vp, message, channelId) {
  var args = message.content.split(" ");
  var sequencer = new Sequencer(vp);
  vp.liveSequences[args[1]] = sequencer;
  //id, falseLoopDelay, priority, channelId
  sequencer.simpleCameraSequence(args[1], args[2], args[3], args[4], channelId);
}

module.exports.registerSCQ = registerSCQ;

async function onDeviceDestroCheck(vp, message, entityId, value) {
  console.log(
    `${helpers.ts(3)} ${helpers.ts(
      2
    )} ${entityId} ${value} onDeviceDestroCheck `
  );
  if (value == 1) {
    if (vp.dat.destroSenders.hasOwnProperty(entityId)) {
      vp.dcheckValList[vp.dat.destroSenders[entityId]]++;
      // console.log(`onSenderOn val ${vp.dcheckValList[vp.dat.destroSenders[entityId]]}`)
      //ring alarm check
      console.log(
        `${helpers.ts(3)} ${helpers.ts(2)} PostSender ${
          vp.dat.destroSenders[entityId]
        }: ${vp.dcheckValList[vp.dat.destroSenders[entityId]]}`
      );

      setTimeout(async function () {
        if (
          vp.dcheckValList[vp.dat.destroSenders[entityId]] >= 1 &&
          vp.dat.destroCheckNameList[vp.dat.destroSenders[entityId]]
            .alertCount <
            vp.dat.destroCheckNameList[vp.dat.destroSenders[entityId]]
              .maxAlertCount
        ) {
          console.log(
            `${helpers.ts(3)} ${helpers.ts(2)} ALARM SENDER ${
              vp.dat.destroSenders[entityId]
            }: ${vp.dcheckValList[vp.dat.destroSenders[entityId]]}`
          );
          //RING ALARM
          var channel = vp.client.channels.cache.get(
            vp.dat.destroCheckNameList[vp.dat.destroSenders[entityId]].channel
          );
          channel.send(
            `${helpers.ts(2)} ${vp.dat.destroSenders[entityId]}:boom: Alert ${
              vp.dat.destroCheckNameList[vp.dat.destroSenders[entityId]]
                .alertCount + 1
            }/${
              vp.dat.destroCheckNameList[vp.dat.destroSenders[entityId]]
                .maxAlertCount
            }`
          );
          vp.dat.destroCheckNameList[vp.dat.destroSenders[entityId]][
            "alertCount"
          ] += 1;
          helpers.jsonUpdate(fs, vp.dataName, vp.dat);
          vp.dcheckValList[vp.dat.destroSenders[entityId]] = 0;
          console.log(
            `${helpers.ts(3)} ${helpers.ts(2)} ALARM SENDER END ${
              vp.dat.destroSenders[entityId]
            }: ${vp.dcheckValList[vp.dat.destroSenders[entityId]]}`
          );
        }
      }, 3000);
    } else if (vp.dat.destroReceivers.hasOwnProperty(entityId)) {
      vp.dcheckValList[vp.dat.destroReceivers[entityId]] = 0;
      console.log(
        `${helpers.ts(3)} ${helpers.ts(2)} PostReceiver On ${
          vp.dat.destroReceivers[entityId]
        }: ${vp.dcheckValList[vp.dat.destroReceivers[entityId]]}`
      );
    }
  } else if (value == 0 && vp.dat.destroReceivers.hasOwnProperty(entityId)) {
    vp.dcheckValList[vp.dat.destroReceivers[entityId]] = 0;
    console.log(
      `${helpers.ts(3)} ${helpers.ts(2)} PostReceiver Off ${
        vp.dat.destroReceivers[entityId]
      }: ${vp.dcheckValList[vp.dat.destroReceivers[entityId]]}`
    );
    // console.log(`onReceiverOff val ${vp.dcheckValList[vp.dat.destroReceivers[entityId]]}`)
  }
}

module.exports.onDeviceDestroCheck = onDeviceDestroCheck;

async function createDestroCheck(vp, message) {
  //!destrocheck type(sender/receiver/?delete) name entityId maxAlertCount tts?
  var args = message.content.split(" ");
  var type = args[1];
  if (args[1] == "sender" || args[1] == "receiver") {
    if (vp.dat.destroCheckNameList == undefined) {
      vp.dat.destroCheckNameList = {};
    }

    // console.log(vp.dat.destroCheckNameList[args[2]] +"|")
    if (vp.dat.destroCheckNameList[args[2]] == undefined) {
      vp.dat.destroCheckNameList[args[2]] = {};
    }

    // console.log(vp.dat.destroCheckNameList[args[2]]+"|")
    vp.dat.destroCheckNameList[args[2]]["channel"] = message.channelId;
    vp.dat.destroCheckNameList[args[2]]["maxAlertCount"] = +args[4];
    vp.dat.destroCheckNameList[args[2]]["alertCount"] = 0;
    vp.dcheckValList[args[2]] = 0;
    // console.log(vp.dat.destroCheckNameList[args[2]]+"|")
  }

  if (type == "sender") {
    vp.dat.destroSenders[args[3]] = args[2];
  } else if (type == "receiver") {
    vp.dat.destroReceivers[args[3]] = args[2];
  }

  helpers.jsonUpdate(fs, vp.dataName, vp.dat);
}

module.exports.createDestroCheck = createDestroCheck;

//scq seqName cameraId falseLoopDelay priority
async function stopSCQ(vp, message) {
  var args = message.content.split(" ");
  if (vp.liveSequences.hasOwnProperty(args[1])) {
    message.reply(`Stopping SCQ ${args[1]}`);
    vp.liveSequences[args[1]]["continueFlag"] = false;
  } else {
    message.reply(`Could not find SCQ ${args[1]}`);
  }
}

module.exports.stopSCQ = stopSCQ;

async function bankSCQ(vp, message) {
  var args = message.content.split(" ");
  vp.dat.SCQBank[args[1]] = {
    cameraId: args[2],
    falseLoopDelay: args[3],
    priority: args[4],
    channel: message.channelId,
  };
  helpers.jsonUpdate(fs, vp.dataName, vp.dat);
  // seqName cameraId falseLoopDelay priority
}
module.exports.bankSCQ = bankSCQ;

async function promoteToLeader(vp, message) {
  var args = message.content.split(" ");
  // Send Team Message without using convenience method
  if (args.length != 2) {
    message.reply(`Usage: !lead YourSteamId`);
    return;
  }

  var response = "";
  await vp.rustplus.sendRequest(
    {
      promoteToLeader: {
        steamId: args[1],
      },
    },
    (x) => {
      console.log(x);
      if (x != undefined) {
        message.reply(JSON.stringify(x));
      }
    }
  );
  // seqName cameraId falseLoopDelay priority
}
module.exports.promoteToLeader = promoteToLeader;
// }
// module.exports.fcmRegisterDevice = fcmRegisterDevice;
