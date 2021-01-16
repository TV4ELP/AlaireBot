const BasicCommand = require('../basicCommand').classObj;
const DiscordJS = require('discord.js'); //For Embeds
const URL = require("url").URL; //For checking if we get a link

const defaults = {
   command : "/permissions",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      "admin"
   ],
   params : 'optional: Message Link for Custom Message (rightclick on message and copy link)'
};

module.exports.defaults = defaults;
module.exports.classObj = class createRoleReactions extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent

   }
 
   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }
      let reactionHelper = this.getReactionHelper();


      let didExecute = this.executeForLink(reactionHelper);
      if(didExecute){
         return true; //we are done here. 
      }

      let pairs = reactionHelper.getAllPairs();
      let message = this.createReactionMessage(pairs, reactionHelper);

      this.event.channel.send(message).then(discordMessage => {
         reactionHelper.registerReactionMessage(discordMessage.id, defaults);
         this.addDefaultReactions(pairs, discordMessage, reactionHelper);
      });
   }

   executeForLink(reactionHelper){
      let message = this.getMessageFromLink();

      if(message == false){
         return false;
      }

      message.then( messageObj => {
         reactionHelper.registerReactionMessage(messageObj.id, defaults);
         let pairs = reactionHelper.getAllPairs();
         this.addDefaultReactions(pairs, messageObj, reactionHelper);
   
         this.event.channel.send("Your Message was updated");
      });

      return true;

   }

   //Create a new Reaction and Save The ID in the ReactionDatabase
   createReactionMessage(pairs, reactionHelper){
      //First Create a message/embed we can react to
      let embed = new DiscordJS.MessageEmbed();
      embed.setColor('#62a608');
      embed.setTitle('React for Roles');
      embed.setAuthor('Alaire', 'https://cdn.discordapp.com/avatars/586915769493880842/35e9c9874d02e256c5b702e003688937.png'); //Name, Icon
      embed.setDescription('React to the Role you want to have!');

      pairs.forEach(pairObj => {
         let role = reactionHelper.getRoleById(pairObj.roleId);
         let emote = reactionHelper.getEmoteObjectFromId(pairObj.emoteId);
         embed.addField(role.name, emote.toString(), true); //Title, Content, Inline
      });
      embed.setFooter('I really do hate Discords Reaction APi');
      
      return embed;
   }

   //Add all Emotes From the pairs as Default Emotes so Users can click them
   addDefaultReactions(pairs, discordMessage, reactionHelper){
      reactionHelper.reactToMessageWithPairs(pairs, discordMessage);
   }

   //We can combine times so 10m 15s is 10minutes and 15seconds 
   //Valid URLS look like this: https://discord.com/channels/705514780819062846/799738161705517066/799989570128314378
   //First Number is Guild ID|| Second Number is Channel ID || Third Number is Message ID
   getMessageFromLink(){
      let message = false;
      this.params.forEach(element => {
         //get the last charackter from an argument
         let url = new URL(element);
         if(url.hostname == "discord.com"){
            //great, we have a DiscordLink. Now See if this is in a channel which we control
            const path = url.pathname; ///channels/705514780819062846/799738161705517066/799989570128314378
            let pathArray = path.split('/'); //split it up ['channels', '705514780819062846', '799738161705517066', '799989570128314378']

            //No Path, no Game
            if(pathArray.length == 0){
               return;
            }
            pathArray = pathArray.filter(Boolean); //remove empty strings


            const iterator = pathArray.values();
            //Wrong Link, bye bye
            if(iterator.next().value != 'channels'){
               return;
            }

            const guildId = iterator.next().value;
            //No guild or not the guild the Bot is currently in, bye bye
            if(guildId == null || guildId != this.getGuildFromMessage().id){
               return;
            }

            const channelId = iterator.next().value;
            let channelObj = this.getChannel(channelId);
            //No Channel? Then go away
            if(channelObj == null || channelObj.deleted){
               return;
            }

            const messageId = iterator.next().value;
            //no message iD? We out here
            if(messageId == null){
               return;
            }
            message = channelObj.messages.fetch(messageId);
         }
      });

      return message;
   }
}