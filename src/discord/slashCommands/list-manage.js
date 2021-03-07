const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");

module.exports = class slashcommandListManage extends slashcommandListAdd {

   constructor(process, interaction, args, userId, channel){
      super(process, interaction, args, userId, channel)
   }
 
   //Generate Link with UserID and one time login pass
   processSubGroup(){

      let showOptions = this.args.options[0];
      let listName = undefined;
      let count = undefined;

      showOptions.options?.forEach(element => {
         if(element.name === 'listname'){
            listName = element.value;
         }

         if(element.name === 'count'){
            count = element.value;
         }
      });

      if(showOptions.name == "random"){
         if(!listName && !count){
            this.respondWithDefaultRandomImage();
            return;
         }

         this.respondWithCountImage(count, listName);
      }

      if(showOptions.name == "by-name"){

      }
   }

}