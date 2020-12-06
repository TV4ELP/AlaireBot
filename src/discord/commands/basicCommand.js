const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const permissionHelper = require('../permissionHelper');
const reactionHelper = require('../reactionHelper');

//Defaults get loadded into the Databse on first run. Currently can't be edited from outside the code
const defaults = {
   command : "",
   filePath : "",
   forcedStart : true,
   enabled : false,
   permissions : []
};

module.exports.defaults  = defaults;
module.exports.classObj = class BasicCommand {
   constructor(discord, eventData, user, database){
      this.client = discord.client;
      this.event = eventData;
      this.user = user;
      this.database = database;
      this.permissions = [];
      this.mainDB = discord.mainDB;
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

   getMentionRoles(){
      let mentions = this.event.mentions;
      return mentions.roles;
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
      let muteDatabasePath = this.database.get('muteDatabasePath').value();
      let mutedDatabase = low(new FileSync(muteDatabasePath));
      return mutedDatabase;
   }

   reactionDatabase(){
      let reactionDatabasePath = this.database.get('reactionDatabasePath').value();
      let reactionDatabase = low(new FileSync(reactionDatabasePath));
      return reactionDatabase;
   }

   isAdmin(user){
      let adminUser = this.database.get('owner').value();
      if(user.id == adminUser){
         return true;
      }
      return false;
   }

   getGuildFromMessage(){
      let guild = this.event.guild;
      if(guild == null){
         guild = this.event.message.guild;
      }

      return guild;
   }

   isCommandAllowed(permissions){
      const permissionsHelper = this.getPermissionHelper();
      let allowed = permissionsHelper.isCommandAllowed(permissions, this.event.member);
      return allowed;
   }

   getPermissionHelper(){
      const permissionHelperObj = new permissionHelper(this.client, this.getGuildFromMessage().id, this.mainDB);
      return permissionHelperObj;
   }

   getReactionHelper(){
      const reactionHelperObject = new reactionHelper(this.client, this.getGuildFromMessage().id, this.mainDB);
      return reactionHelperObject;
   }

   //Get all parameter from a message
   getParamsFromMessage(message, commandObj){
      if(this.params == null){
         //first lets remove the command from the content
         let content = message.content;
         content = content.replace(commandObj.command,'');
         //we already handel mentions in the basicCommand, so out with those too
         content = content.replace(/<@.*?>/g, '').trim();
         //Now we have the mostly clean message (hopefully)
         //Arguments (for now) are space separated
         this.params = content.match(/[^\s"]+|"([^"]*)"/ig);
      }

      return this.params;
      
   }

}