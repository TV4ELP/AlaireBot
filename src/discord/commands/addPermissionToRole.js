const BasicCommand = require('./basicCommand.js').classObj;


const defaults = {
   command : "/addPermToGroup",
   filePath : "addPermissionToRole.js",
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
         //TODO DO SMTH 
         return false;
      }

      let permissionHelper = this.getPermissionHelper();
      let permissions = permissionHelper.getPermissionFromParams(this.params);
      let user = this.getMentions();

      mentions.each(user => {
         
      });
   }


}