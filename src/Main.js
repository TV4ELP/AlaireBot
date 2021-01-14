const fs = require('fs');;
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Discord = require('./discord/Discord.js');

module.exports = class Main {
   constructor(){
      //Setup if it is the first Start
      this.mainDB = (fs.existsSync('.firstStart') == false ? this.Setup() : this.AfterStart() );
      this.discord = this.GetDiscord();
   }

   Setup(){
      fs.writeFile('.firstStart', "", () => {
         (fs.existsSync('./storage') == false ? fs.mkdirSync('./storage') : null);   
      });
   
      console.log('CREATED INITIAL CONFIG');
      //We now have our DB, return it. 
      return this.AfterStart();
   }


   AfterStart(){
      let db = low(new FileSync('storage/main.json'));
      db.set('storagePath', 'storage/').write();     
      return db;
   }

   GetDiscord(){
      let discord = new Discord(this.mainDB);
      return discord;
   }

   //Everything Setup, we now only need to Start the Modules
   Start(){
      this.discord.Start();
   }
}