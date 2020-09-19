const BasicCommand = require('../basicCommand').classObj;
const DiscordJS = require('discord.js'); //For Embeds


const defaults = {
   command : "/permissions",
   filePath : "createRoleReaction.js",
   forcedStart : true,
   enabled : true,
   permissions : [
      "admin"
    ]
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

      let pairs = reactionHelper.getAllPairs();
      let message = this.createReactionMessage(pairs, reactionHelper);

      this.event.channel.send(message).then(discordMessage => {
         reactionHelper.registerReactionMessage(discordMessage.id);
         this.addDefaultReactions(pairs, discordMessage, reactionHelper);
      });
   }

   //Create a new Reaction and Save The ID in the ReactionDatabase
   createReactionMessage(pairs, reactionHelper){
      //First Create a message/embed we can react to
      let embed = new DiscordJS.MessageEmbed();
      embed.setColor('#62a608');
      embed.setTitle('React For Roles');
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


   


}