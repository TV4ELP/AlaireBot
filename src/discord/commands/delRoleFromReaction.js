const addRoleFromReaction = require('./addRoleFromReaction.js').classObj;


const defaults = {
   command : "",
   filePath : "delRoleFromReaction.js",
   forcedStart : false,
   enabled : true,
   permissions : []
};

module.exports.defaults = defaults;
module.exports.classObj = class delRoleFromReaction extends addRoleFromReaction{

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
      let reactionDb = this.reactionDatabase();
      
      let existing = reactionDb.get('roleAndEmote').find({emoteId : emoteId});
      if(existing.value() == null){
         //Todo Nichts weil böse
         return;
      }

      let pair = existing.value();
      let roleId = pair.roleId;

      if(reactionHelper.userHasRole(roleId, reactionHelper.getGuildUserFromUser(this.user))){
         reactionHelper.userDelRole(roleId, reactionHelper.getGuildUserFromUser(this.user));
      }
   }
}