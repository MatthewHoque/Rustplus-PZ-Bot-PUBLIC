const { SlashCommandBuilder } = require("discord.js");
const discordHelpers = require("../discordHelpers.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lead")
    .setDescription("setting lead")
    .addStringOption(option =>
        option
            .setName('steamid')
            .setDescription('steamid of user u want to make lead')),
  async execute(interaction, vp, fcm, client) {
    console.log(interaction.options.getString("steamid"))
    // const guild = client.guilds.cache.get(interaction.guildId);
    // if (!guild)
    //   return console.log(`Can't find the guild with ID ${interaction.guildId}`);
    // console.log(interaction.member.id)
    // guild.members
    //   .fetch(interaction.member.id)
    //   .then((memberList) => {
    //     // console.log(memberList)
    //     if (
    //       discordHelpers.roleOR(
    //         discordHelpers.getUser(interaction.member.id, memberList),
    //         vp.dat.setLeadRoles
    //       )
    //     ) {
    //       rr.promoteLeadIntegrated(vp, interaction);
    //     }
    //   })
    //   .catch(console.error);
  },
};
