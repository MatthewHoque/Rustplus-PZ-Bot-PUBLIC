const { SlashCommandBuilder } = require("discord.js");
// var mainVariables=require("../main.js")
const discordHelpers = require("../discordHelpers.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("for getting info"),
  async execute(interaction,vp,fcm,client) {
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
                description: require('../configs/userInfo.json').info,
              },
            ],
            //this is the important part
            ephemeral: true,
          });
          delete require.cache[require.resolve("../configs/userInfo.json")];
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
  },
};
