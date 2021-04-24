const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");
const DiscordJS = require('discord.js');

module.exports = class slashcommandListGet extends slashcommandListAdd {

   constructor(process, interaction, args, userId, channel){
      super(process, interaction, args, userId, channel)
   }
 
   processSubGroup(){

      let options = this.args.options;
      let listName = undefined;

      options?.forEach(element => {
         if(element.name === 'listname'){
            listName = element.value;
         }
      });

      //Instantly respond with a "waiting"
      this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
         data: {
            type: 5,
            data : {
               flags : 64
            }
         }
      });


      //Now finish the respons up
      
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);
      let isPublic = listsHelper.isListAlreadyPublic(this.interaction.guild_id, listName);

      if(isPublic){
         new DiscordJS.WebhookClient(this.process.client.user.id, this.interaction.token).send('There is a list with the same name already public');
      }else{
         this.process.client.users.fetch(this.userId).then(user => {
            let text = "";
            if(listsHelper.makeListPublic(listName, user) == false) {
               text = "You have no list with that name";
            }else{
               text = "made your list public"
            }
            new DiscordJS.WebhookClient(this.process.client.user.id, this.interaction.token).send(text);
         }); 
         
      }

      //check if Listname ist Part of the Public Lists
   }

}