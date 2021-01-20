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
}