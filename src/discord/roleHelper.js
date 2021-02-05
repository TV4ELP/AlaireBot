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
      database.push({groupName : name, mainRoles : [], subRoles : []}).write();
      return true;
   }

   //Update the Master Roles
   //Return resulting Role Id Array on completion
   //Returns false if no group is present
   updateMainRoles(name, rolesCollection){
      let database = this.helperDatabase().get('roleGroup');
      let existing = database.find({groupName : name});
      if(existing.value() == null){
         return false
      }

      existing.get('mainRoles').remove( () => {return true}).write();
      rolesCollection.each( role => {
            existing.get('mainRoles').push(role.id).write();
      });

      return existing.get('mainRoles').value();
   }

   //Update the Sub Roles
   //Return resulting Role Id Array on completion
   //Returns false if no group is present
   updateSubRoles(name, rolesCollection){
      let database = this.helperDatabase().get('roleGroup');
      let existing = database.find({groupName : name});
      if(existing.value() == null){
         return false
      }

      existing.get('subRoles').remove( () => {return true}).write();
      rolesCollection.each( role => {
            existing.get('subRoles').push(role.id).write();
      });

      return existing.get('subRoles').value();
   }


   //
   //Returns an Array of all SubRoles where a mainRole is = input 
   //Returns empty array if nothing is found
   findAdditionalRolesInGroups(roleId){
      let database = this.helperDatabase().get('roleGroup');
      let existing = database.filter( x => {
         if(x.subRoles.includes(roleId)){
            return true;
         }
      }).value();

      return existing;
   }
}