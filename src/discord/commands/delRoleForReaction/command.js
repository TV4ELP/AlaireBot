const addRoleForReaction = require('../addRoleForReaction/command').classObj;


const defaults = {
   command : "/delRoleForReaction",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      "admin"
    ]
};

module.exports.defaults = defaults;
module.exports.classObj = class delRoleForReaction extends addRoleForReaction{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }
 
   execute(){
      super.execute();
   }

   //We only care for the Emotes
   checkValid(emoteArray, roleMap){
      let returnVal = true;
      if(emoteArray.length == 0){
         this.event.channel.send('No Emote specified');
         returnVal = false;
      }
      return returnVal;
   }

   updateDatabase(emoteId, reactionDb, roleId){
      let existing = reactionDb.get('roleAndEmote').find({emoteId : emoteId});
      let existingObj = existing.value()
      let resultObj = Object(); //init so no crash

      //If this pair exists, YEET it out
      if(existing.value() != null){  
         let uff = reactionDb.get('roleAndEmote').remove({emoteId : emoteId}).write();
         resultObj.emoteId = emoteId;
         resultObj.roleId = existingObj.roleId;
         this.respond(resultObj);
         return true;
      }else{
         this.respondNothing();
      }
   }

   respondNothing(){
      this.event.channel.send('That Emote is not tied to any Role yet for Reactions')
   }

   respond(resultObj){
      let reactionHelper = this.getReactionHelper();
      let emote = reactionHelper.getEmoteObjectFromId(resultObj.emoteId); //assume it exists for now. Should be checked at some point
      let role = reactionHelper.getRoleById(resultObj.roleId); //assume it exists for now
      this.event.channel.send('Role ' + role.name + ' is removed from emote ' + emote.toString())
   }


}