const BasicCommand = require('../basicCommand.js').classObj;
const DiscordJS = require('discord.js'); //For Embeds

const defaults = {
   command : "/help",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [],
   params : 'You are here'
};

module.exports.defaults = defaults;
module.exports.classObj = class help extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }
 
   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }
      
      //Gotta need all Commands to Help ya find what you need
      const allCommands = this.discord.GetAllCommands();
      let message = this.discord.createHelpEmbed(allCommands, this.getGuildFromMessage().id, this.event.member);

      this.event.channel.send(message);
   }
}