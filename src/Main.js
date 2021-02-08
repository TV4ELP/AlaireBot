//We need filesystem access. Loading this module does that
const fs = require('fs');
//Module to treat json files in a database like way
const low = require('lowdb');
//We wan't to write and read synchronously to keep things simple
const FileSync = require('lowdb/adapters/FileSync');
//Main just sets the envirtoment up, the Discord Class sets the Bot up/starts it
const Discord = require('./discord/Discord.js');

module.exports = class Main {
   constructor(){
      this.mainDB = this.Setup();
      this.discord = this.GetDiscord();
   }

   //check if all folders/files are where we need em
   Setup(){
      if(fs.existsSync('./storage') == false){
         fs.mkdirSync('./storage')
      } 
      console.log("Storage Folder is setup");

      //Lists are not associated with any guilds. They are with members
      if(fs.existsSync('./storage/lists') == false){
         fs.mkdirSync('./storage/lists')
      } 
      console.log("List Folder is setup");

      //We now have our DB, return it. 
      let db = low(new FileSync('storage/main.json'));

      if(db.get('storagePath').value() == null){
         db.set('storagePath', 'storage/').write();
      }

      if(db.get('globalCommands').value() == null){
         db.set('globalCommands', []).write();
      }      

      if(db.get('listsStoragePath').value() == null){
         db.set('listsStoragePath', 'storage/lists/').write();
      }
      console.log("Main Database is Setup");

      return db;
   }

   //Create the Discord Object with our main Database
   GetDiscord(){
      let discord = new Discord(this.mainDB);
      return discord;
   }

   //Everything Setup, we now only need to start the bot
   Start(){
      this.discord.Start();
      console.log("Startup passed, initialising Bot");
   }
}