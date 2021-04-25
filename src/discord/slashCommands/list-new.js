const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");
const DiscordJS = require('discord.js');

module.exports = class slashcommandListNew extends slashcommandListAdd {

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
      this.process.client.users.fetch(this.userId).then(user => {
         let result = listsHelper.createDatabaseByname(listName, user)

         let text = "";
         if(result) {
            text = 'Created new empty List: ' + listName;
         }else{
            text = "A List with the name already exists";
         }

         new DiscordJS.WebhookClient(this.process.client.user.id, this.interaction.token).send(text);
      });
      

   }

}