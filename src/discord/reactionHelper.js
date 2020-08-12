const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
const permissionHelper = require('./permissionHelper');
module.exports = class reactionHelper extends permissionHelper {

   constructor(discordClient, guildId, mainDB){
      super(discordClient, guildId, mainDB);
   }

   setupPermissionDBForGuild(){
      let storageFile = this.storagePath + this.guildId + '/reaction.json';

      let reactionDB = low(new FileSync(storageFile));
      reactionDB.defaults({reaction : [], roleAndEmote : []}).write();
      this.guildDB.set('reactionDatabasePath', storageFile).write();
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

   //React with every Emote in the Pair on the DiscordMessage
   reactToMessageWithPairs(pairs, discordMessage){
      pairs.forEach(pairObj => {
         let emote = this.getEmoteObjectFromId(pairObj.emoteId);
         discordMessage.react(emote);
      });
   }

   //We need to register the Message ID so we can check on which Reaction was Reacted on, and if we want to do anything with it
   registerReactionMessage(discordMessageId){
      let reactionDb = this.reactionDatabase();
      reactionDb.get('reaction').push(discordMessageId).write();
   }

   //Get ReactionMessage from ID
   isReactionInDB(discordMessageId){
      let reactionDb = this.reactionDatabase();
      //Dont't know if i can get it directly with lodash without that workaround...
      let messageReactionArray = reactionDb.get('reaction').value();
      let messageReaction = messageReactionArray.find(element => element == discordMessageId);
      return messageReaction != null;
   }

   // This is how a Discord Emote is build <:name:1234567890:>
   //We want only the ID
   getDiscordEmotesFromMessage(messageStr){
      let emoteIDs = messageStr.match(/(?<=<:.*:)([0-9]*)(?=>)/ig); //lookback <:XXX: match numbers lookahead >
      return emoteIDs;
   }

   //Return all Pairs as array   [{emoteId,roleId}, {emoteId,roleId} ...]
   getAllPairs(){
      let reactionDb = this.reactionDatabase();
      let pairs = reactionDb.get('roleAndEmote').value();
      return pairs;
   }

   reactionDatabase(){
      let reactionDatabasePath = this.guildDB.get('reactionDatabasePath').value();
      let reactionDatabase = low(new FileSync(reactionDatabasePath));
      return reactionDatabase;
   }

   //Not gonna bother right now, Unicode emojis are retarded and stupid
   getUnicodeEmotesFromMessage(messageStr){
      return Array();
   }
  //Reactions take only emote ID!!!!
  //For messages we need emoji.toStr or the actual unicode shitter
}