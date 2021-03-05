const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");

module.exports = class slashcommandListGet extends slashcommandListAdd {

   constructor(process, interaction, args, userId, channel){
      super(process, interaction, args, userId, channel)
   }
 
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

   respondWithCountImage(count = 1, dbName = "default"){
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);

      this.process.client.users.fetch(this.userId).then(user => {
         let image = listsHelper.getRandomImageCount(user, dbName, count);
         if(image != listHelper.ERROR_NO_DB){
            let response = "";
            let i = 1;
            image.forEach(element => {
               response += i + ": " + element.url + " \n";
               i ++;
            })
            this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
               data: {
                  type: 5
               }
            });
            
            this.channel.send(response, {split : true});
         }
      });
   }


   respondWithDefaultRandomImage(){
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);
      this.process.client.users.fetch(this.userId).then(user => {
         
         let content;
         let image = listsHelper.getRandomImage(user);
         if(image == listHelper.ERROR_NO_DB){
            content = "Couldn't find a list with that name";
         }else{
            content = image.url;
         }

         this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
            data: {
               type: 4,
               data : {
                  content: content
               }
            }
         });
      });
   }




   /*

if(nameOrRandom.name === 'by-name'){
            let imageName = null;
            let listName = null;

            let getOptions = nameOrRandom.options;
            getOptions.forEach(element => {   
               if(element.name === 'imagename'){
                  imageName = element.value;
               }

               if(element.name === 'listname'){
                  listName = element.value;
               }
            });
            this.client.users.fetch(userId).then(user => {
               let image = listsHelper.getRandomImage(user, listName);
               if(image == listHelper.ERROR_NO_IMAGE_WITH_NAME){
                  this.client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                     type: 4,
                     data : {
                        content: "I couldn't find what you are looking for"
                     }
                  }
                  });
                  return;
               }

               this.client.api.interactions(interaction.id, interaction.token).callback.post({data: {
                  type: 4,
                  data : {
                     content: image.url
                  }
               }
               });
            });
         }



   */

}