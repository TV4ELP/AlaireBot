const addRoleForReaction = require('../addRoleForReaction/command').classObj;


const defaults = {
   command : "/emote-for-role-delete",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      "admin"
   ],
   params : 'Remove a Remote from the Reaction Function \n USAGE: /emote-for-role-delete @Role !OR! ServerEmote'
};

module.exports.defaults = defaults;
module.exports.classObj = class delRoleForReaction extends addRoleForReaction{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }
 
   execute(){
      super.execute();
   }

   updateDatabase(emoteId, reactionDb, roleId){
      let existing = reactionDb.get('roleAndEmote').find({emoteId : emoteId});
      let existingObj = existing.value();
      let resultObj = Object(); //init so no crash

      //If this pair exists, YEET it out
      if(existing.value() != null){  
         reactionDb.get('roleAndEmote').remove({emoteId : emoteId}).write();
         resultObj.emoteId = existingObj.emoteId;
         resultObj.roleId = existingObj.roleId;
         this.respond(resultObj);
         return true;
      }

      //Maybe we need to delete by role
      existing = reactionDb.get('roleAndEmote').find({roleId : roleId});
      if(existing.value() != null){
         existingObj = existing.value();
         reactionDb.get('roleAndEmote').remove({roleId : roleId}).write();
         resultObj.emoteId = existingObj.emoteId;
         resultObj.roleId = existingObj.roleId;
         this.respond(resultObj);
         return true;
      }

      this.event.channel.send('That Emote or Role is not used yet for Reactions')
   }


   respond(resultObj){
      let reactionHelper = this.getReactionHelper();
      let emote = reactionHelper.getEmoteObjectFromId(resultObj.emoteId); //assume it exists for now. Should be checked at some point
      let role = reactionHelper.getRoleById(resultObj.roleId); //assume it exists for now
      this.event.channel.send('Role ' + role.name + ' is removed from emote ' + emote.toString())
   }


}