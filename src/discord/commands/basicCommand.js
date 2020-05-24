const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

module.exports = class BasicCommand {
    constructor(discord, eventData, user, database, params){
        this.client = discord.client;
        this.event = eventData;
        this.user = user;
        this.database = database;
        this.params = params;
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

    muteDatabase(){
        let muteDatabsePath = this.database.get('muteDatabsePath').value();
        let mutedDatabase = low(new FileSync(muteDatabsePath));
        return mutedDatabase;
    }

}