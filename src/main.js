const varPooler = require("./varPooler.js");
const discordHelpers = require("./discordHelpers.js");
const helpers = require("./helpers.js");
const fs = require("fs");
const rr = require("./reqReg.js");
const fcmHandler = require("./fcmHandler.js");

var vp = new varPooler();
var fcm = new fcmHandler(vp);
// fcm.startup();

// vp.startup();

// DISCORD
const { REST, Routes } = require("discord.js");
const { Client, IntentsBitField, GatewayIntentBits } = require("discord.js");
var tokenFile = require("./discordToken.json");

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "code",
    description: "For guest code",
  },
];
const rest = new REST({ version: "10" }).setToken(tokenFile.token);

async function regDiscordCmds(CLIENT_ID, GUILD_ID, commands) {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
tokenFile.devGuildId.forEach((guildId)=>{
  regDiscordCmds(tokenFile.clientId, guildId, commands); // Call the async function to execute the code
})


const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

vp.setDiscordClient(client);
vp.client.login(tokenFile.token);

vp.client.on("ready", () => {
  console.log("===DISCORD BOT CONNECTED===");
  // console.log(vp.dat)
  if (vp.dat.currentChannel != null) {
    vp.registeredChannel = vp.dat.currentChannel;
    // console.log(vp.registeredChannel);
    const channel = vp.client.channels.cache.get(vp.registeredChannel.v);
    if (channel != undefined) {
      channel.send("Rustalz Online: Currently registered to this channel");
    }
  }
  if (vp.dat.vendingChannel != null) {
    vp.vendingChannel = vp.dat.vendingChannel;
    // console.log(vp.vendingChannel);
    const channel = vp.client.channels.cache.get(vp.vendingChannel.v);
    if (channel != null) {
      channel.send("Rustalz Online: Sending vending notifs to this channel");
    }
  }
  if (vp.dat.fcmChannel != null) {
    vp.fcmChannel = vp.dat.fcmChannel;
    // console.log(vp.vendingChannel);
    const channel = vp.client.channels.cache.get(vp.fcmChannel.v);
    if (channel != null) {
      channel.send("Current FCM Channel");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply({
      embeds: [
        {
          title: `Hello`,
          description: ``,
        },
      ],
      //this is the important part
      ephemeral: true,
    });
  } else if (interaction.commandName === "code") {
    const guild = client.guilds.cache.get(interaction.guildId);
    if (!guild)
      return console.log(`Can't find the guild with ID ${interaction.guildId}`);
    guild.members
      .fetch() //this gives a whole list if user id not found, using incorrectly initially
      .then(async (memberList) => {
        // console.log(memberList);
        // console.log(interaction.member.user.id);
        if (
          discordHelpers.roleOR(
            discordHelpers.getUser(interaction.member.user.id, memberList),
            vp.dat.getInfoRoles
          )
        ) {
          await interaction.reply({
            embeds: [
              {
                title: `Do not share, if asked, refer to this command`,
                description: require("./configs/userInfo.json").info,
              },
            ],
            //this is the important part
            ephemeral: true,
          });
          delete require.cache[require.resolve("./configs/userInfo.json")];
        } else {
          await interaction.reply({
            embeds: [
              {
                title: `You do not have permissions for this`,
                description: "Contact Rustalz admin",
              },
            ],
            //this is the important part
            ephemeral: true,
          });
        }
      })
      .catch(console.error);
  }
});

vp.client.on("messageCreate", (message) => {
  if (!message.content.startsWith("!")) {
    return;
  }

  console.log(message.content);
  if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content == "!register"
  ) {
    vp.registeredChannel.v = message.channelId;
    message.reply("Registered: " + vp.registeredChannel.v);
    vp.dat.currentChannel = vp.registeredChannel;
    helpers.jsonUpdate(fs, vp.dataName, vp.dat);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content == "!fcmr"
  ) {
    vp.fcmChannel.v = message.channelId;
    message.reply("FCM: " + vp.fcmChannel.v);
    vp.dat.fcmChannel = vp.fcmChannel;
    helpers.jsonUpdate(fs, vp.dataName, vp.dat);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content == "!fcmstart"
  ) {
    if (!fcm.isStarted) {
      fcm.startup();
      message.reply("Listening for FCM");
    } else {
      message.reply("FCM already started");
    }
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content == "!vending"
  ) {
    vp.vendingChannel.v = message.channelId;
    message.reply("Vending: " + vp.vendingChannel.v);
    vp.dat.vendingChannel = vp.vendingChannel;
    helpers.jsonUpdate(fs, vp.dataName, vp.dat);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!device ")
  ) {
    rr.regDevice(fcm, vp, message);
  } else if (
    //deviceId deviceID true/false
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!deviceignore")
  ) {
    vp.rpf.ignoreDeviceDiscord(vp, message);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!pulser")
  ) {
    vp.rpf.makePulse(vp, message);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!rename")
  ) {
    fcm.lastPairRename(message);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!ms")
  ) {
    vp.rpf.mapScanSwitch(vp, message);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!server")
  ) {
    const channel = client.channels.cache.get(registeredChannel);
    vp.rustplus.getInfo((rustMsg) => {
      //rustMsg=JSON.parse(JSON.stringify(rustMsg).replace("type","dType"))
      console.log(JSON.stringify(rustMsg));
      // message.reply(`Now listening for ${args[2]}. Type: ${rustMsg.response.entityInfo.dType}  State: ${rustMsg.swawwresponse.entityInfo.payload.value}`)
    });
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!vi")
  ) {
    var args = message.content.split(" ");
    vp.vendingInterval["r"] = args[1];
    message.reply(
      `Vending Interval set to-: \`\`\`${vp.vendingInterval["r"]}\`\`\``
    );
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!i ")
  ) {
    var args = message.content.split(" ");
    var argsString = "";
    for (i = 1; i < args.length; i++) {
      argsString += args[i] + ", ";
      vp.vendingIgnore[args[i]] = true;
    }
    message.reply(`Will ignore vending machine(s) ${argsString}`);
    helpers.jsonUpdate(
      fs,
      "./src/configs/vendingIgnore.json",
      vp.vendingIgnore
    );
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!cami")
  ) {
    var args = message.content.split(" ");
    var argsString = "";
    for (i = 1; i < args.length; i++) {
      argsString += args[i] + ", ";
      vp.dat.camIgnore[args[i]] = true;
    }
    message.reply(`Will ignore player(s) ${argsString}`);
    helpers.jsonUpdate(fs, vp.dataName, vp.dat);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!buying")
  ) {
    var args = message.content.split(" ");
    for (i = 1; i < args.length; i++) {
      vp.vendingSearch.buying[args[i]] = true;
      message.reply(`Will notify on ${args[i]} buying`);
    }
    helpers.jsonUpdate(
      fs,
      "./src/configs/vendingSearch.json",
      vp.vendingSearch
    );
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!selling")
  ) {
    var args = message.content.split(" ");
    for (i = 1; i < args.length; i++) {
      vp.vendingSearch.selling[args[i]] = true;
      message.reply(`Will notify on ${args[i]} selling`);
    }
    helpers.jsonUpdate(
      fs,
      "./src/configs/vendingSearch.json",
      vp.vendingSearch
    );
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!search")
  ) {
    rr.regSearch(vp, message);
  } else if (
    vp.perms.discordMap.hasOwnProperty(message.author.id) &&
    message.content.startsWith("!stash")
  ) {
    var artificalMsg = {
      content:
        message.content +
        " " +
        message.author.id +
        " " +
        vp.perms.discordMap[message.author.id],
    };
    rr.regStash(vp, artificalMsg, message);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!vspecial")
  ) {
    //vendingMachine buying/selling item dir AmountOfOrders
    vp.rpf.registerSpecialVending(message, vp.vendingSpecial);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!scq ")
    //simple camera sequence
    //scq seqName
  ) {
    vp.rpf.registerSCQ(vp, message, message.channelId);
    vp.rpf.bankSCQ(vp, message);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!scqstop")
    //scqstop seqName
  ) {
    vp.rpf.stopSCQ(vp, message);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content == "!rraid"
  ) {
    vp.raidChannel.v = message.channelId;
    message.reply("Registered: " + vp.raidChannel.v);
    helpers.jsonUpdate(fs, vp.dataName, vp.dat);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content == "!rgeneral"
  ) {
    vp.generalChannel.v = message.channelId;
    message.reply("Registered: " + vp.generalChannel.v);
    helpers.jsonUpdate(fs, vp.dataName, vp.dat);
  } else if (
    vp.dat.leadPerm.includes(message.author.id) &&
    message.content.startsWith("!lead")
  ) {
    rr.promoteLead(vp, message);
  } else if (
    vp.dat.discordPerms.includes(message.author.id) &&
    message.content.startsWith("!destrocheck")
  ) {
    vp.rpf.createDestroCheck(vp, message);
  } else if (message.content.startsWith("!dm")) {
    message.author.createDM();
  } else if (message.content.startsWith("!selfinfo")) {
    message.reply(JSON.stringify(message));
  } else if (message.content.startsWith("!setinfo")) {
    const guild = client.guilds.cache.get(message.guildId);
    if (!guild)
      return console.log(`Can't find the guild with ID ${message.guildId}`);
    guild.members
      .fetch(message.authorId)
      .then((memberList) => {
        // console.log(memberList)
        if (
          discordHelpers.roleOR(
            discordHelpers.getUser(message.author.id, memberList),
            vp.dat.setInfoRoles
          )
        ) {
          var newInfo = { info: message.content.replace("!setinfo", "") };
          helpers.jsonUpdate(fs, "./src/configs/userInfo.json", newInfo);
        }
      })
      .catch(console.error);
  } else if (
    message.content.startsWith("!getinfo") ||
    message.content.startsWith("!info")
  ) {
    const guild = client.guilds.cache.get(message.guildId);
    if (!guild)
      return console.log(`Can't find the guild with ID ${message.guildId}`);
    guild.members
      .fetch(message.authorId)
      .then((memberList) => {
        // console.log(memberList);
        if (
          discordHelpers.roleOR(
            discordHelpers.getUser(message.author.id, memberList),
            vp.dat.getInfoRoles
          )
        ) {
          // try{
          message.author
            .send(require("./configs/userInfo.json").info)
            .catch(
              message.reply("Messaged unless DMs are off").catch(console.error)
            );
          // }catch(error){
          //   console.log()
          // }
          delete require.cache[require.resolve("./configs/userInfo.json")];
        }
      })
      .catch(console.error);
  }
});

// console.log(`${JSON.stringify(guild.members)}`);

// endDISCORD

//RUST+

// wait until connected before sending commands
vp.rustplus.on("connected", async () => {
  console.log("==== RUST+ CONNECTED ====");
  console.log("MapSize", vp.dat.servers[vp.dat.current].mapSize);
  // console.log(data.servers[data.current].squaresX);
  // console.log(data.servers[data.current].squaresY);
  vp.isDisconnected["v"] = false;

  if (
    vp.dat.servers[vp.dat.current].mapSize != null &&
    vp.dat.servers[vp.dat.current].squaresX != null &&
    vp.dat.servers[vp.dat.current].squaresY != null
  ) {
    console.log("mapmarkers possible");

    await helpers.delay(3000);
    rr.regMapMarkerScanLoop(vp);
  }
  vp.rpf.loadDevices(
    vp.dat,
    vp.rustplus,
    vp.client,
    vp.registeredChannel,
    vp.dataName,
    vp
  );
});

// listen for messages from rust server
vp.rustplus.on("message", (message) => {
  //console.log("message")
  // check if message is an entity changed broadcast
  if (message.broadcast && message.broadcast.entityChanged) {
    console.log("===========================================");
    console.log(JSON.stringify(message));
    console.log("===========================================");
  }

  if (message.broadcast && message.broadcast.teamMessage) {
    console.log("------start------");
    console.log(JSON.stringify(message));
    console.log("------end------");
    sidto = message.broadcast.teamMessage.message.steamId;
    test = { low: 100146761, high: 17825793, unsigned: true };
    // if (helpers.compareSteamID(sidto, test)) {
    if (message.broadcast.teamMessage.message.message.startsWith("1")) {
      console.log(
        `message.broadcast.teamMessage.message.message.startsWith("1sh"): ${message.broadcast.teamMessage.message.message.startsWith(
          "1sh"
        )}`
      );
      console.log(`vp.perms.stashPerm=${JSON.stringify(vp.perms.stashPerms)}`);
      console.log(
        `message.broadcast.teamMessage.message.steamId.toString()=${message.broadcast.teamMessage.message.steamId.toString()}`
      );
      console.log(
        `vp.perms.stashPerms.includes(message.broadcast.teamMessage.message.steamId)=${vp.perms.stashPerms.includes(
          message.broadcast.teamMessage.message.steamId.toString()
        )}`
      );
      console.log("command");
      //!time

      if (message.broadcast.teamMessage.message.message.startsWith("1time")) {
        rr.regGameTime(vp);
      }
      //!pop
      else if (
        message.broadcast.teamMessage.message.message.startsWith("1pop")
      ) {
        rr.regPop(vp, message);
        // require("./configs/perms.json");
      } else if (
        message.broadcast.teamMessage.message.message.startsWith("1sh")
      ) {
        vp.perms = require("./configs/perms.json");
        if (
          vp.perms.stashPerms.includes(
            message.broadcast.teamMessage.message.steamId.toString()
          )
        ) {
          console.log("perms working for stash");
          var artificalMsg = {
            content:
              message.broadcast.teamMessage.message.message +
              " " +
              message.broadcast.teamMessage.message.steamId.toString() +
              " " +
              message.broadcast.teamMessage.message.name
                .toString()
                .replace(/ /g, "_"),
          };
          console.log(
            `artificla message for stash = ${JSON.stringify(artificalMsg)}`
          );
          rr.regStash(vp, artificalMsg);
        }
      }
      // }
    }
  }

  if (message.broadcast && message.broadcast.entityChanged) {
    var entityChanged = message.broadcast.entityChanged;

    // log the broadcast
    //console.log(message.broadcast);

    var entityId = entityChanged.entityId;
    var value = entityChanged.payload.value;

    vp.rpf.onDeviceDestroCheck(vp, message, entityId, value);
    // log the entity status

    var serverDevices =
      vp.dat.devices[vp.dat.servers[vp.dat.current].name].deviceHash;

    if (serverDevices[entityId]["ignoreDiscord"] != "true") {
      var channel = vp.client.channels.cache.get(
        serverDevices[entityId].channel
      );
      channel.send(
        `[${helpers.ts(2)}] ${
          entityChanged.payload.value ? ":green_circle:" : ":red_circle: "
        } **${serverDevices[entityId].name}**`
      );
      if (
        serverDevices[entityId].tts != undefined &&
        serverDevices[entityId].tts != "notts"
      ) {
        channel.send({
          content:
            serverDevices[entityId].tts +
            (entityChanged.payload.value ? " On" : " Off"),
          tts: true,
        });
      }

      console.log(
        "entity " + entityId + " is now " + (value ? "active" : "inactive")
      );
    }
  }

  if (message.broadcast && message.broadcast.cameraRays) {
    vp.camHandler.dataReceived(message);
  }
});

vp.rustplus.on("disconnected", () => {
  vp.rustplus.disconnect();
  vp.isDisconnected["v"] = true;
  console.log("DISCONNECTION DETECTED LINE 794 (DISCONNECTED)");
  process.exit(1);
});

vp.rustplus.on("error", (error) => {
  vp.rustplus.disconnect();
  vp.isDisconnected["v"] = true;
  console.log("DISCONNECTION DETECTED LINE 806 (ERROR)");
  console.log(error);
  process.exit(1);
  while (!vp.isDisconnected["v"]) {
    helpers.delay(60000);
    console.log("disconnected, attempting connect");
    vp.rustplus.connect();
  }
});

// connect to rust server
console.log("Attempting Rust+ Connect");
vp.rustplus.connect();

//endRUST+
