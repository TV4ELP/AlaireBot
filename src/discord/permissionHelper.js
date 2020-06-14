const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
module.exports = class permissionHelper {

   constructor(discordClient, guildId, mainDB){
      this.discordClient = discordClient;
      this.guildId = guildId
      this.mainDB = mainDB;
      this.storagePath = this.getStoragePath();
   }

   setupPermissionDBForGuild(){
      //First get all available permission from commands
      let availablePermissions = this.database.get('commands').map('permissions')
         .flatten() //make flat list
         .uniq() //remove duplicates
         .value(); //and then get the actual array to work on
      if(availablePermissions == null){
         availablePermissions = []; //Fallback so the following code doesn't yeet itself
      }

      let storageFile = this.storagePath + this.guildId + 'permissions.json';
      //create the DB
      let database = low(new FileSync(storageFile));
      database.defaults({availablePermissions : [], users : {}, roles : []}).write(); //User but also roles can have their own permissions

      //All Permission into the DB please
      let availablePermissionsInDB = database.get('availablePermissions');
      availablePermissions.forEach(element => {
         availablePermissionsInDB.push(element);
      });
      availablePermissionsInDB.write();
      
      let guildConfig = low(new FileSync(this.storagePath + this.guildId + 'config.json'));
      guildConfig.set('permissionDatabasePath', storageFile); 
   }

   getStoragePath(){
      return this.mainDB.get('storagePath').value;
   }


   roleHasPermissions(){
      //return true/false
   }

   userHasPermission(){
      //return true/false
   }

   isCommandAllowed(commandPermissionArray, user){
      
      array.forEach(permissionName => {
         if(this.roleHasPermissions(permissionName, user) == false){ //if the role doesn't have the permission, maybe the user does
            if(this.userHasPermission(permissionName, user) == false){ //likewise, the individual user permission overwrite everything
               return false;
            }
         }
      });
      //either the user ot the group had all the permission allowed, so we cool here
      return true;
      
   }

   
   getPermissionDB(){
      let guildConfig = low(new FileSync(this.storagePath + this.guildId + 'config.json'));
      return low(new FileSync(guildConfig.get('permissionDatabasePath').value()));
   }
}