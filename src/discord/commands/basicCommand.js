module.exports = class BasicCommand {
    constructor(discord, eventData, user, database){
        this.client = discord.client;
        this.event = eventData;
        this.user = user;
        this.database = database;
    }

    execute(){
        this.event.reply("HI").then( () => {
            console.log("sendCommand");
        }).catch(() => {
            console.log("error");
        });
    }

    //Returns MessageMentions Type
    getMentions(){
        let mentions = this.event.mentions;
        return mentions.members;
    }

    //check if a user has a role
    userHasRole(roleID, user){
        let roleManager = user.roles;
        let roles = roleManager.cache;
        return roles.has(roleID);
    }

    muteRoleId(){
        let muteRole = this.database.get('muterole').value();
        return muteRole;
    }

}