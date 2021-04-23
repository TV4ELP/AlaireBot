const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");

module.exports = class slashcommandListGet extends slashcommandListAdd {

   constructor(process, interaction, args, userId, channel){
      super(process, interaction, args, userId, channel)
   }
 
   processSubGroup(){

      let showOptions = this.args.options;
      let listName = undefined;
      let count = undefined;

      showOptions?.forEach(element => {
         if(element.name === 'listname'){
            listName = element.value;
         }

         if(element.name === 'count'){
            count = element.value;
         }
      });

      if(!listName && !count){
         this.respondWithDefaultRandomImage();
         return;
      }

      this.respondWithCountImage(count, listName);

      if(showOptions.name == "by-name"){

      }
   }

   respondWithCountImage(count = 1, dbName = "default"){
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);

      this.process.client.users.fetch(this.userId).then(user => {
         let image = listsHelper.getRandomImageCount(user, dbName, count);
         let flag = 0;
         if(image != listHelper.ERROR_NO_DB){
            let response = "";
            let i = 1;
            if(image){
               image.forEach(element => {
                  response += i + ": " + element.url + " \n";
                  i ++;
               });
            }else{
               response = "You have no image in this list";
               flag = 64; //ephemeral aka, only you can see it
            }
            
            this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
               data: {
                  type: 4,
                  data : {
                     content : response,
                     flags : flag
                  }
               }
            });
            
            //this.channel.send(response, {split : true}); we probably never need to split since we can only output 5 items anyways. 
         }
      });
   }


   respondWithDefaultRandomImage(){
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);
      this.process.client.users.fetch(this.userId).then(user => {
         
         let content;
         let flag = 0;
         let image = listsHelper.getRandomImage(user);
         if(image == listHelper.ERROR_NO_DB){
            content = "Couldn't find a list with that name";
         }

         if(image){
               content = image.url;
         }else{
            content = "You have 0 Images in this List";
            flag = 64; //ephemeral aka, only you can see it
         }

         this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
            data: {
               type: 4,
               data : {
                  content: content,
                  flags : flag
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