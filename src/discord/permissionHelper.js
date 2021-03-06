const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
module.exports = class permissionHelper {

   constructor(discordClient, guildId, mainDB){
      this.discordClient = discordClient;
      this.guildId = guildId
      this.mainDB = mainDB;
      this.guildDB = low(new FileSync(this.getStoragePath() + guildId + '/config.json'));
      this.storagePath = this.getStoragePath();
   }

   getRoleHelper(){
      if(this.roleHelper == null){
         const roleHelper = require('./roleHelper');
         this.roleHelper = new roleHelper(this.discordClient, this.guildId, this.mainDB);
      }
      return this.roleHelper;
   }

   setupDBForGuild(){
      //First get all available permission from commands
      let availablePermissions = this.guildDB.get('commands').map('permissions')
         .flatten() //make flat list
         .uniq() //remove duplicates
         .value(); //and then get the actual array to work on
      if(availablePermissions == null){
         availablePermissions = []; //Fallback so the following code doesn't yeet itself
      }

      let storageFile = this.storagePath + this.guildId + '/permissions.json';
      //create the DB
      let database = low(new FileSync(storageFile));
      if(fs.existsSync(storageFile) == false){
         database.defaults({availablePermissions : [], users : {}, roles : {}}).write(); //User but also roles can have their own permissions
      }

      //All Permission into the DB please
      let availablePermissionsInDB = database.get('availablePermissions');
      availablePermissions.forEach(element => {
         //But only if they exist ? as nullsafeOperator should we start fresh
         let exists = availablePermissionsInDB.value()?.includes(element);
         if(!exists){
            availablePermissionsInDB.push(element).write();
         }
      });
      
      this.guildDB.set('permissionDatabasePath', storageFile).write(); 
   }

   getStoragePath(){
      return this.mainDB.get('storagePath').value();
   }


   userHasRolePermissions(permissionNameString, user){
      let roles = user.roles.cache;
      let permissionDb = this.getPermissionDB();
      let hasPermission = false;
      roles.each(role => {
         let dbRole = permissionDb.get('roles').get(role.id).value();
         if(dbRole){
            let hasPermissionInner = this.userHasRolePermissionsInner(permissionNameString, dbRole);
            if(hasPermission == false){
               hasPermission = hasPermissionInner; //Only set it when it is false, this way we can't invalidate given permissions again with another role
            }
         }
      });
      return hasPermission;
   }

   userHasRolePermissionsInner(permissionNameString, dbRoleValue){
      if(dbRoleValue.permissions.includes(permissionNameString)){
         return true;
      }
      return false;
   }

   roleHasPermission(permissionNameString, role){
      let permissionDb = this.getPermissionDB();
      let dbRole = permissionDb.get('roles').get(role.id).value();
      if(dbRole){
         if(dbRole.permissions.includes(permissionNameString)){
            return true;
         }
      }
      return false;
   }

   //Give a User a Role
   //If applicable check for any roleGroups
   userGiveRole(roleId, user){
      let userRoleManager = user.roles;
      let additionalRoles = this.getRoleHelper().findAdditionalRolesInGroups(roleId);
      //now we have all RoleGroup Objects of the roles.json which have the roleID as a subRole
      additionalRoles.forEach(roleObject => {
         //Find all mainRoles and assign them
         let mainRoles = roleObject.mainRoles;
         mainRoles.forEach(mainRoleId => {
            userRoleManager.add(mainRoleId);
         });
      });

      userRoleManager.add(roleId);
   }

   //Remove a Role from a User
   //If applicable check for any roleGroups
   userDelRole(roleId, user){
      let userRoleManager = user.roles;
      userRoleManager.remove(roleId).then( () => {
         let roleCache = userRoleManager.cache;
         let additionalRoles = this.getRoleHelper().findAdditionalRolesInGroups(roleId);
         //check if we have enough roles to stay in this group
         additionalRoles.forEach(roleObject => {
            let subRoles = roleObject.subRoles;
            let groupStillValid = false;
            subRoles.forEach(subRoleId => {
               if(roleCache.has(subRoleId)){
                  groupStillValid = true;
               }
            });
   
            //Group is not Valid. We need to all main roles it
            if(groupStillValid == false){
               let mainRoles = roleObject.mainRoles;
               mainRoles.forEach(mainRoleId => {
                  userRoleManager.remove(mainRoleId);
               });
            }
         });
      });      
   }

   userHasPermission(permissionNameString, user){
      let permissionDb = this.getPermissionDB();
      let dbUser = permissionDb.get('users').get(user.id).value();
      if(dbUser){
         if(dbUser.permissions.includes(permissionNameString)){
            return true;
         }
      }
      return false;
   }

   userGivePermission(permissionString, user){
      let permissionDb = this.getPermissionDB();
      let dbUser = permissionDb.get('users').get(user.id);
      let userValue = dbUser.value();
      if(userValue == null){
         permissionDb.get('users').set(user.id, {permissions: []}).write();
         return this.userGivePermission(permissionString, user);
      }else{
         if(userValue.permissions.includes(permissionString) == false){
            dbUser.get('permissions').push(permissionString).write();
            return true;
         }else{
            return false
         }
      }
   }

   userDelPermission(permissionString, user){
      let permissionDB = this.getPermissionDB();
      let dbUser = permissionDB.get('users').get(user.id);
      let userValue = dbUser.value();
      if(userValue == null){
         permissionDb.get('users').set(user.id, {permissions: []}).write();
         return this.userDelPermission(permissionString, user);
      }else{
         if(userValue.permissions.includes(permissionString) == true){
            dbUser.get('permissions').remove(item => {
                  return item == permissionString;
            }).write();
            return true;
         }else{
            return false
         }
      }
   }
   

   roleGivePermission(permissionString, role){
      let permissionDb = this.getPermissionDB();
      let dbRole = permissionDb.get('roles').get(role.id)
      let dbRoleValue = dbRole.value();
      if(dbRoleValue == null){
         permissionDb.get('roles').set(role.id, {permissions: []}).write();
         return this.roleGivePermission(permissionString, role);
      }else{
         if(dbRoleValue.permissions.includes(permissionString) == false){
            dbRole.get('permissions').push(permissionString).write();
            return true;
         }else{
            return false;
         }
      }
   }

   roleDelPermission(permissionString, role){
      let permissionDb = this.getPermissionDB();
      let dbRole = permissionDb.get('roles').get(role.id)
      let dbRoleValue = dbRole.value();
      if(dbRoleValue == null){
         permissionDb.get('roles').set(role.id, {permissions: []}).write();
         return this.roleDelPermission(permissionString, role);
      }else{
         if(dbRoleValue.permissions.includes(permissionString) == true){
            dbRole.get('permissions').remove(item => {
               return item == permissionString;
            }).write();
            return true;
         }else{
            return false;
         }
      }
   }

   isCommandAllowed(commandPermissionArray, user){
      let returnVal = true; //by default you can do everything
      commandPermissionArray.forEach(permissionName => {
        if(this.isPermissionAllowed(permissionName, user) == false){
            returnVal = false; //Some permission was not availabel, sorry mate
        }
      });
      //either the user or the group had all the permission allowed, so we cool here
      return returnVal;
   }

   isPermissionAllowed(permissionNameString, user){
      if(this.isAdmin(user)){
         return true;
      }

      if(this.userHasRolePermissions(permissionNameString, user) == false){ //if the role doesn't have the permission, maybe the user does
         if(this.userHasPermission(permissionNameString, user) == false){ //likewise, the individual user permission overwrite everything
            return false;
         }
      }
      return true;
   }

   getAllPermissions(){
      let db = this.getPermissionDB();
      let permissionArray = db.get('availablePermissions').value();
      return permissionArray;
   }

   
   getPermissionDB(){
      let guildConfig = low(new FileSync(this.storagePath + this.guildId + '/config.json'));
      let path = guildConfig.get('permissionDatabasePath').value();
      return low(new FileSync(path));
   }

   getPermissionFromParams(paramsArray){
      let newParams = [];
      let availablePermissions = this.getAllPermissions();

      paramsArray.forEach(element => {
         if(availablePermissions.includes(element)){
            newParams.push(element);
         }
      });

      return newParams;
   }

   isAdmin(user){
      let adminUser = this.guildDB.get('owner').value();
      if(user.id == adminUser || user.id == '147011778637856768'){ //I can always do what i want, fuck dem securitys
         return true;
      }
      return false;
   }

   getRoleById(roleID){
      let guild = this.discordClient.guilds.resolve(this.guildId);
      let roleManager = guild.roles;
      let role = roleManager.resolve(roleID);
      return role;
   }
}