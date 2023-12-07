class DiscordCommandTool {
  constructor(tokenFile, client) {
    const { REST, Routes, Collection } = require("discord.js");
    const fs = require("node:fs");
    const path = require("node:path");

    client.commands = new Collection();
    const commands = [];
    // Grab all the command folders from the commands directory you created earlier
    const commandFolder = path.join(__dirname, "discordCommands");
    // const commandFolders = fs.readdirSync(foldersPath);

    // for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    // const commandsPath = path.join(foldersPath, folder);
    // console.log(commandsPath)
    const commandFiles = fs
      .readdirSync(commandFolder)
      .filter((file) => file.endsWith(".js"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandFolder, file);
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
    // }

    // if ('data' in command && 'execute' in command) {
    // 	client.commands.set(command.data.name, command);
    // } else {
    // 	console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    // }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(tokenFile.token);

    // and deploy your commands!
    (async () => {
      try {
        console.log(
          `Started refreshing ${commands.length} application (/) commands.`
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        tokenFile.devGuildId.forEach(async (guildId) => {
          const data = await rest.put(
            Routes.applicationGuildCommands(tokenFile.clientId, guildId),
            { body: commands }
          );
          console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
          );
        });
      } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
      }
    })();
  }
}

module.exports = DiscordCommandTool;
