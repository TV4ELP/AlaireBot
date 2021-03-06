const BasicCommand = require('../basicCommand.js').classObj;

const defaults = {
   command : "/kick",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [
      "mute",
   ],
   params : '"Kick" a User by giving him a Role that makes them unable to write in the Server \n USAGE: /kick @User + Time  \n (1H = 1 Hour, 2M = 2 Minutes, 3S = 3 Seconds, 2H30M = 2 Hours and 30 Minutes)'
};
module.exports.defaults = defaults;
module.exports.classObj = class KickUser extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }

   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }

      this.duration = this.getTimeFromParams();
      this.reason = this.getReasonFromParams();

      let mentions = this.getMentions();
      if(this.muteRoleId() == null){
         this.event.channel.send("There is no Role defined");
         return;
      }

      mentions.each(user => {
         if(this.isAlreadyMuted(user) == false){
               user.roles.add(this.muteRoleId(), "Muted by User " + this.user.displayName)
               .then(() => this.event.channel.send("Muted " + user.displayName))
               .then(() => this.handleMute(user));
         }else{
               this.event.channel.send("Already muted " + user.displayName + " Updated Time from now on");
               this.handleMute(user);
         }
      });
   }

   isAlreadyMuted(user){
      return this.userHasRole(this.muteRoleId(), user);
   }

   handleMute(guildMember){
      let muteBase = this.muteDatabase();
      let muteUser = muteBase.get('currentlyMuted');
      let muteCount = muteBase.get('mutedCount');
      let userObj = muteUser.find({ id : guildMember.id});
      if(userObj.value() == null){
         userObj = {
               id : guildMember.id,
               timestamp : Date.now(),
               duration : this.duration,
               reason : this.reason
         };

         muteUser.push(userObj).write();
      }else{
         userObj.update('timestamp', () => Date.now()).write();
         userObj = userObj.update('reason', () => this.reason).write();
            //Now we want to work for sure with the Object and not the lodash wrapper so we overwrite it
      }

      //In any case, update the count
      let counter = muteCount.find({ id : guildMember.id});
      if(counter.value() == null){
         let countObj = {
               id : guildMember.id,
               count : 1,
               pastMutes : [userObj]
         };
         muteCount.push(countObj).write();
      }else{
         counter.update('count', n => n + 1).write();
         counter.get('pastMutes').push(userObj).write();
      }
   }

   //We can combine times so 10m 15s is 10minutes and 15seconds 
   //Time is always in miliseconds
   getTimeFromParams(){
      let time = 0;
      this.params.forEach(element => {
         //get the last charackter from an argument
         let lastPos = element.substring(element.length -1).toUpperCase();
         let mod = 0;
         switch (lastPos) {
               case 'S':
                  mod = 1000;
               break;
               case 'M':
                  mod = 1000 * 60;
                  break;
               case 'H':
                  mod = 1000 * 60 * 24;
               break;
               default:
                  //Probably no actual time Value
               return 10 * 1000 * 60; //lets just make it 10mins
            }

         time += element.substring(0, element.length -1) * mod;
      });

      return time;
   }

   getReasonFromParams(){
      let reason = "No Reason supplied"
      this.params.forEach(element => {
         //Get the thing in quotes (always double qoutes pleases)
         let content = element.match(/".*?"/g, '');
         if(content != null){
               reason = content[0];
         }
      });
      return reason;
   }
}