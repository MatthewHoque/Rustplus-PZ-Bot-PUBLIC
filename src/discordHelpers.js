class discordHelpers {
  static getUser(userId, guildMembers) {
    // console.log(guildMembers.length);
    var foundMember = null;
    guildMembers.forEach((curMember) => {
      if (curMember.user.id == userId) {
        console.log(curMember.user.id,userId)
        foundMember = curMember;
      }
    });

    return foundMember;
  }

  static roleOR(member, roles) {
    var ret = false;
    roles.forEach((rRole) => {
      member._roles.forEach((mRole) => {
        // console.log(`mRole ${mRole} vs ${rRole} = ${mRole == rRole}`);
        // console.log(rRole,typeof(rRole),mRole,typeof(mRole))
        if (mRole == rRole) {
          ret = true;
        }
      });
    });
    return ret;
  }
}

module.exports = discordHelpers;
