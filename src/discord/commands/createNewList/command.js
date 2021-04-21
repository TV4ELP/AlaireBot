const BasicCommand = require('../basicCommand.js').classObj;

const defaults = {
   command : "/list-new",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   global : true,
   permissions : [],
   params : 'Create a new List \n USAGE: /list-new listName \n The Listname CAN\'T contain spaces. '
};

module.exports.defaults = defaults;
module.exports.classObj = class createNewList extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }

   execute(){
      let name = null;
      if(this.params != null){
         name = this.params[0];
      }
      
      let listsHelper = this.getListsHelper();
      
      if(name != null){
         let result = listsHelper.createDatabaseByname(name, this.user)
         if(result){
            this.event.channel.send('Create new empty List: ' + name);
         }else{
            this.event.channel.send('A List with the name already exists');
         }
         //In any case, we are done here
         return;
      }

      //Create a default List that we can use for when no name is specified
      listsHelper.createDatabaseByname("default", this.user);
      this.replyBad('You didn\'t gave me a name, no name equals default list. Usefull for quickly adding pictures');
   }
}