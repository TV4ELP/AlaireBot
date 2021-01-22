const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
const permissionHelper = require('./permissionHelper');


module.exports = class roleHelper extends permissionHelper {
   constructor(discordClient, guildId, mainDB){
      super(discordClient, guildId, mainDB);
   }

   setupDBForGuild(){
      let storageFilePath = this.storagePath + this.guildId + '/roles.json';

      if(fs.existsSync(storageFilePath) == false){
         let reactionDB = low(new FileSync(storageFilePath));
         reactionDB.defaults({roleGroup : []}).write();
      }
      this.guildDB.set('rolesDatabasePath', storageFilePath).write();

      return storageFilePath;
   }

   helperDatabase(){
      let roleDatabasePath = this.guildDB.get('rolesDatabasePath').value();
      if(roleDatabasePath == null){
         roleDatabasePath = this.setupDBForGuild();
      }

      let roleDatabase = low(new FileSync(roleDatabasePath));
      return roleDatabase;
   }

   //Create a new Named Group. 
   //Returns true on create.
   //Returns false if it already exists 
   createNewGroup(name){
      let database = this.helperDatabase().get('roleGroup');
      let existing = database.find({groupName : name}).value();
      //we already have it, lets go
      if(existing){
         return false;
      }

      //Set the empty group
      database.push({groupName : name, roles : []}).write();
      return true;
   }
}