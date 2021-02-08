const BasicCommand = require('../basicCommand.js').classObj;

const defaults = {
   command : "/list create new",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   permissions : [],
   params : '/list create new listName (can\'t contain spaces)'
};

module.exports.defaults = defaults;
module.exports.classObj = class createNewList extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }

   execute(){
      //no doing shit if we aren't even allowed to
      if(this.isCommandAllowed(defaults.permissions) == false){
         this.event.channel.send('You dont have the Permissions needed')
         return false;
      }

      let name = this.params[0];
      if(name != null){
         let listsHelper = this.getListsHelper();
         let result = listsHelper.createDatabaseByname(name, this.user)
         if(result){
            this.event.channel.send('Create new empty List: ' + name);
         }else{
            this.event.channel.send('A List with the name already exists');
         }
         //In any case, we are done here
         return;
      }
      this.replyBad('You didn\'t gave me a name for the List');
   }
}