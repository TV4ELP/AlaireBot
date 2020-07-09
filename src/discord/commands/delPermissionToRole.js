const BasicCommand = require('./addPermissionToRole.js').classObj;


const defaults = {
   command : "/removePermission",
   filePath : "delPermissionToRole.js",
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