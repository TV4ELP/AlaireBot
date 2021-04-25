const reactionAddRole = require('./addRole.js').classObj;


const defaults = {
   command : "",
   filePath : __dirname,
   forcedStart : false,
   enabled : true,
   permissions : []
};

module.exports.defaults = defaults;
module.exports.classObj = class reactionRemoveRole extends reactionAddRole{

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
      let guild = this.client.guilds.resolve(reactionHelper.guildId);
      guild.members.fetch(this.user.id).then(user => {
         reactionHelper.userDelRole(roleId, user);
         this.respondGiven(roleId, reactionHelper);
      });
   }
}