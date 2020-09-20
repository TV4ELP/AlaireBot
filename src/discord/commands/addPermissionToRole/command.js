const BasicCommand = require('../basicCommand.js').classObj;


const defaults = {
   command : "/addPermission",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      "admin"
    ]
};

module.exports.defaults = defaults;
module.exports.classObj = class addPermissionToRole extends BasicCommand{

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
            if(permissionHelper.userHasPermission(permissionString, user) == false){
               permissionHelper.userGivePermission(permissionString, user);
               this.event.channel.send("User updated with permission: " + user.displayName);
            }else{
               this.event.channel.send("User already had that permission: " + user.displayName);
            }
         });
   
         roleMentions.each(role => {
            if(permissionHelper.roleHasPermission(permissionString, role) == false){
               permissionHelper.roleGivePermission(permissionString, role);
               this.event.channel.send("Role updated with permission: " + role.name);
            }else{
               this.event.channel.send("Role already had that permission: " + role.name);
            }
         });
      });

      
   }


}