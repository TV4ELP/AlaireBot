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
      let message = this.createEmbed(allCommands);

      this.event.channel.send(message);
   }

   //Create a nice Looking Response with Headlines and stuff
   createEmbed(commandList){
      //First Create a message/embed we can react to
      let embed = new DiscordJS.MessageEmbed();
      embed.setTitle('You need help? I have help');
      embed.setAuthor('Alaire', 'https://cdn.discordapp.com/avatars/586915769493880842/35e9c9874d02e256c5b702e003688937.png'); //Name, Icon
      embed.setDescription('Here are all the commands i know');

      let hiddenCounter = 0;
      commandList.forEach(value =>{
         if(!value.defaults.enabled || value.defaults.command == '') {
            return;
         }

         let permissionArray = value.defaults.permissions;
         let commandName = value.defaults.command;
         let params = value.defaults.params;

         //If we are not allowed, abort, but count it
         if(this.isCommandAllowed(permissionArray) == false){
            hiddenCounter ++;
            return;
         }
         
         if(params == ''){
            params = "No input required";
         }

         if(permissionArray.length > 0){
            commandName += " (Needed Permissions: " + permissionArray.toString() + ")"; 
         }

         embed.addField(commandName, params, false); //Title, Content, Inline 
      });

      if(hiddenCounter > 0){
         embed.setFooter('You have missing permissions to see ' + hiddenCounter + ' additional Commands');
      }
      
      return embed;
   }
}