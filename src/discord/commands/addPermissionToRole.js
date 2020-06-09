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
      this.getAllPermissions();
   }

   getAllPermissions(){
      let availablePermissions = this.database.get('commands').map('permissions').flatten().uniq().value();
      if(availablePermissions == null){
         availablePermissions = []; //Fallback so the following code doesn't yeet itself
      }
      return availablePermissions;
   }
}