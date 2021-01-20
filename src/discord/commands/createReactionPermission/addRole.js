const AddRoleForReaction = require('../addRoleForReaction/command').classObj;


const defaults = {
   command : "",
   filePath : "reactionAddRole.js",
   forcedStart : false,
   enabled : true,
   permissions : []
};

module.exports.defaults = defaults;
module.exports.classObj = class reactionAddRole extends AddRoleForReaction{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent

   }
 
   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }

      let emoteId = this.params.emote.id;
      let reactionHelper = this.getReactionHelper();
      let reactionDb = this.helperDatabase();
      
      let existing = reactionDb.get('roleAndEmote').find({emoteId : emoteId});
      if(existing.value() == null){
         //Todo Nichts weil böse
         return;
      }

      let pair = existing.value();
      let roleId = pair.roleId;

      //we need to fetch the dumb stupid USer because DIscord JS is dumb and caches shit in dumb ways
      //TODO, check for groups with the fancy schmanzy role helper
      this.client.guilds.fetch(reactionHelper.guildId).then( guild => {
         guild.members.fetch(this.user.id).then(user => {
            reactionHelper.userGiveRole(roleId, user);
            this.respondGiven(roleId, reactionHelper);
         });
      });


   }

 

   //giveFeedback when you get the role
   respondGiven(roleId, reactionHelper){
      //let role = reactionHelper.getRoleById(roleId); //assume it exists for now
      //this.event.message.channel.send('Role ' + role.name + ' is now yours');
   }


}