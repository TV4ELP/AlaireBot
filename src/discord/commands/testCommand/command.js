const BasicCommand = require('../basicCommand.js').classObj;


const defaults = {
   command : "/test",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      'admin',
      'mute',
      'japanese'
   ],
   params : ''
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

      this.event.channel.send("Hello World");
   }
}