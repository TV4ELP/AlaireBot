const BasicCommand = require('../basicCommand.js').classObj;

const defaults = {
   command : "/updateSubRolesForGroup",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      'admin',
      'RoleManage'
   ],
   params : '/updateSubRolesForGroup GroupName @role (one or multiple)'
};

module.exports.defaults = defaults;
module.exports.classObj = class updateSubRolesForGroup extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }

   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }

      let mentions = this.getMentionRoles();
      let name = this.params[0];

      if(name == null){
         this.replyBad('You didn\'t gave me a name for the group');
         return;
      }

      if(mentions.size == 0){
         this.replyBad('You didn\'t gave me any roles? qwq');
            return;
      }      

      let rolesHelper = this.getRolesHelper();
      let result = rolesHelper.updateSubRoles(name, mentions)
      if(result){
         let roleNames = "";
         mentions.each(role => {
            roleNames += role.name + " ";
         });
         this.event.channel.send('The Group now has the following Roles as Subs: ' + roleNames);
      }else{
         this.event.channel.send('There is no group with this name');
      }
      //In any case, we are done here
      return;
      
   }
}