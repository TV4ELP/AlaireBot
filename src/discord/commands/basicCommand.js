const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const permissionHelper = require('../permissionHelper');

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
   constructor(discord, eventData, user, database, params){
      this.client = discord.client;
      this.event = eventData;
      this.user = user;
      this.database = database;
      this.params = params;
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
      let muteDatabsePath = this.database.get('muteDatabsePath').value();
      let mutedDatabase = low(new FileSync(muteDatabsePath));
      return mutedDatabase;
   }

   isAdmin(user){
      let adminUser = this.database.get('owner').value();
      if(user.id == adminUser){
         return true;
      }
      return false;
   }

   getGuildFromMessage(){
      return this.event.guild;
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

}