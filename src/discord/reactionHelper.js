const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
const permissionHelper = require('./permissionHelper');
module.exports = class reactionHelper extends permissionHelper {

   constructor(discordClient, guildId, mainDB){
      super(discordClient, guildId, mainDB);
   }

   getEmoteFromString(str){
      let results = Array();
      return results
      .concat(this.getDiscordEmotesFromMessage(str))
      .concat(this.getUnicodeEmotesFromMessage(str));
   }

   getEmoteObjectFromId(emoteId){
      let emote = this.discordClient.emojis.resolve(emoteId);
      return emote;
   }

   // This is how a Discord Emote is build <:name:1234567890:>
   //We want only the ID
   getDiscordEmotesFromMessage(messageStr){
      let emoteIDs = messageStr.match(/(?<=<:.*:)([0-9]*)(?=>)/ig); //lookback <:XXX: match numbers lookahead >
      return emoteIDs;
   }

   //Not gonna bother right now, Unicode emojis are retarded and stupid
   getUnicodeEmotesFromMessage(messageStr){
      return Array();
   }
  //Reactions take only emote ID!!!!
  //For messages we need emoji.toStr or the actual unicode shitter
}