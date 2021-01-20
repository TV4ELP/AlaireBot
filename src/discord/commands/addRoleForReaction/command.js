const BasicCommand = require('../basicCommand.js').classObj;


const defaults = {
   command : "/addRoleForReaction",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      "admin"
   ],
   params : '@Role + Emote from Server (Any the Bot is in, is fine)'
};

module.exports.defaults = defaults;
module.exports.classObj = class addRoleForReaction extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }
 
   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }   

      let messageStr = this.event.content;
      let reactionHelper = this.getReactionHelper();

      let emoteArray = reactionHelper.getEmoteFromString(messageStr);
      let roleMap = this.getMentionRoles();
      
      

      //If we have more than one role only the last is used. Don't care right now to fix it TODO
      let roleId = null;
      roleMap.forEach(role => {
         roleId = role.id; 
      }); 

      let emoteId = emoteArray[0]; //We know it has atleast one value

      if(this.checkValid(emoteArray, roleMap) == false){
         return;
      }

      let reactionDb = this.helperDatabase();

      this.updateDatabase(emoteId, reactionDb, roleId);
      
   }

   checkValid(emoteArray, roleMap){
      let returnVal = true;
      if(emoteArray.length == 0){
         this.event.channel.send('No Emote specified');
         returnVal = false;
      }

      if(roleMap.size == 0){
         this.event.channel.send('No Role specified');
         returnVal = false;
      }

      return returnVal;
   }

   updateDatabase(emoteId, reactionDb, roleId){
      let existing = reactionDb.get('roleAndEmote').find({emoteId : emoteId});

      let resultObj = null; //init so no crash

      let assignmentObj = {emoteId : emoteId, roleId: roleId};

      //Update this one
      if(existing.value() != null){ 
         existing.update('roleId', () => roleId).write();
         resultObj = existing.update('emoteId', () => emoteId).write();
         this.respond(resultObj);
         return true;
      }

      existing = reactionDb.get('roleAndEmote').find({roleId : roleId});

      //Update this one instead
      if(existing.value() != null){
         existing.update('roleId', () => roleId).write();
         resultObj = existing.update('emoteId', () => emoteId).write();
         this.respond(resultObj);
         return true;
      }

      //when not exists, make new
      resultObj = reactionDb.get('roleAndEmote').push(assignmentObj).write();
      let index = resultObj.length;
      this.respond(resultObj[index -1]); //this time we get an array, so just use the last one which is the newest
      return true;
   }

   respond(resultObj){
      let reactionHelper = this.getReactionHelper();
      let emote = reactionHelper.getEmoteObjectFromId(resultObj.emoteId); //assume it exists for now. Should be checked at some point
      let role = reactionHelper.getRoleById(resultObj.roleId); //assume it exists for now
      this.event.channel.send('Role ' + role.name + ' is now tied to emote ' + emote.toString())
   }


}