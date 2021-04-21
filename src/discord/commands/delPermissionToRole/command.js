const AddPermissionToRole = require('../addPermissionToRole/command').classObj;


const defaults = {
   command : "/permissions-remove",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      "admin"
   ],
   params : 'Remove a Permission from a USER or ROLE \n USAGE: /permission-remove @User/@Role  Permission-Name'
};

module.exports.defaults = defaults;
module.exports.classObj = class delPermissionToRole extends AddPermissionToRole{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent

   }
 
   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }

      let permissionHelper = this.getPermissionHelper();
      let permissions = permissionHelper.getPermissionFromParams(this.params);
      let userMentions = this.getMentions();
      let roleMentions = this.getMentionRoles();

      permissions.forEach(permissionString =>{
         userMentions.each(user => {
            if(permissionHelper.userHasPermission(permissionString, user) == true){
               permissionHelper.userDelPermission(permissionString, user);
               this.event.channel.send("removed permission from User: " + user.displayName);
            }else{
               this.event.channel.send("User did not have that permission: " + user.displayName);
            }
         });
   
         roleMentions.each(role => {
            if(permissionHelper.roleHasPermission(permissionString, role) == true){
               permissionHelper.roleDelPermission(permissionString, role);
               this.event.channel.send("removed Permission from role: " + role.name);
            }else{
               this.event.channel.send("Role did not have that permission: " + role.name);
            }
         });
      });

      
   }


}