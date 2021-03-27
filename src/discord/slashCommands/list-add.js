const listHelper = require("../listHelper");

module.exports = class slashcommandListAdd {

   constructor(process, interaction, args, userId, channel){
      this.process = process; //process.mainDb/client/storagePath
      this.interaction = interaction; //the interaction itself
      this.args = args; 
      this.userId = userId; //userid who used the interaction
      this.channel = channel; //channel Obj
   }

   processSubGroup(){
      let addOptions = this.args.options;
      let listName = "default"; 
      let url = null;
      let imageName = null;
      addOptions.forEach(element => {
         if(element.name === 'url'){
            url = element.value;
         }

         if(element.name === 'imagename'){
            imageName = element.value;
         }

         if(element.name === 'listname'){
            listName = element.value;
         }
      });
      
      this.process.client.users.fetch(this.userId).then(user => {
         let listsHelper = new listHelper(this.process.client, this.process.mainDB);
         let result = listsHelper.addImageToDatabase(user, listName, url, imageName);

         switch (result) {
            case listHelper.ERROR_INVALID_URL:
               this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({data: {
                  type: 4,
                  data : {
                     content: "That was not a valid URL",
                     flags: 64 //ephemeral aka, only you can see it
                  }
               }
               });
               break;
         
            default:
               this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({data: {
                     type: 4,
                     data : {
                        content : "Added Image to List: " + listName,
                        flags: 64, //ephemeral aka, only you can see it
                     }
                  }
               });
               return; //Everything is fine. Go home
         }
      }); 
   }

}