const BasicCommand = require('../basicCommand.js').classObj;

const defaults = {
   command : "/rolegroup-create",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      'admin',
      'RoleManage'
   ],
   params : 'Create a new Group for Roles. Role Groups allow you to get a Master Group when granting yourself a subgroup \n USAGE: /rolegroup-create GroupName'
};

module.exports.defaults = defaults;
module.exports.classObj = class createRoleGroup extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }

   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }

      let name = this.params[0];
      if(name != null){
         let rolesHelper = this.getRolesHelper();
         let result = rolesHelper.createNewGroup(name)
         if(result){
            this.event.channel.send('Create new empty Role Group: ' + name);
         }else{
            this.event.channel.send('A role with the name already exists');
         }
         //In any case, we are done here
         return;
      }
      this.replyBad('You didn\'t gave me a name for the group');
   }
}