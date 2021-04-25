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
      let userId = undefined;

      showOptions?.forEach(element => {
         if(element.name === 'listname'){
            listName = element.value;
         }

         if(element.name === 'count'){
            count = element.value;
         }

         if(element.name === 'user'){
            userId = element.value;
         }
      });

      if(!listName && !count){
         this.respondWithDefaultRandomImage();
         return;
      }

      this.respondWithCountImage(count, listName, userId);

      if(showOptions.name == "by-name"){

      }
   }

   respondWithCountImage(count = 1, dbName = "default", userId){
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);

      let localUserId = this.userId;
      let isForeignList = false;
      if(userId && dbName != "default"){
         localUserId = userId;
         isForeignList = true;
      }

      if(isForeignList){
         if(listsHelper.isListAlreadyPublic(this.interaction.guild_id, dbName) == false){
            this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
               data: {
                  type: 4,
                  data : {
                     content : "There is no lists with that name, or it isn't public. Check with the /list collection command",
                     flags : 64
                  }
               }
            });

            return;
         }
      }

      this.process.client.users.fetch(localUserId).then(user => {
         let image = listsHelper.getRandomImageCount(user, dbName, count);
         let flag = 0;
         if(image != listHelper.ERROR_NO_DB){
            let response = "";
            let i = 1;
            if(image){
               if(isForeignList){
                  listsHelper.incrementListCounter(user, dbName);
                  this.process.UpdateSingleGuildListRanking(this.interaction.guild_id);
               }
               image.forEach(element => {
                  response += i + ": " + element.url + " \n";
                  i ++;
               });
            }else{
               response = "There are no images in this list";
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
         }else{
            this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
               data: {
                  type: 4,
                  data : {
                     content : "There is no list with that name",
                     flags : 64
                  }
               }
            });
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
            content = "You don't have any lists yet";
            flag = 64;
         }else{
            if(image == undefined){
               content = "You have 0 Images in the default List";
               flag = 64; //ephemeral aka, only you can see it
            }else{
               content = image.url;
            }
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