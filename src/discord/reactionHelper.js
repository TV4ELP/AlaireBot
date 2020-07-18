const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
module.exports = class reactionHelper {

   constructor(){
      //TODO
   }

   getEmoteFromString(str){
      //TODO
   }

   getDiscordEmotesFromMessage(messageStr){
      //regex (?<=<:.*:)([0-9]*)(?=>)
      return Array();
   }

   getUnicodeEmotesFromMessage(messageStr){
      return Array();
   }
  //Reactions take only emote ID!!!!
  //For messages we need emoji.toStr ot the actual unicode shitter
}