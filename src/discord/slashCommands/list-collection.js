const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");
const DiscordJS = require('discord.js');

module.exports = class slashcommandShowLists extends slashcommandListAdd{

   constructor(process, interaction, args, userId, channel){
      super(process, interaction, args, userId, channel)
   }
 
   processSubGroup(){
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);

      let showOptions = this.args.options;
      let user = undefined;
      showOptions?.forEach(element => {
         if(element.name === 'user'){
            user = element.value;
         }
      });

      //respond now. Edit later
      this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({data: {
         type: 5,
         data : {
            flags: 64 //ephemeral aka, only you can see it
         }
      }
      });

      if(user){
         this.showPublicListsForUser(listsHelper, this.args.options[0].value);
         return;
      }

      this.showLists(listsHelper);
      return; //Always end and avoid useless checks
   }

   showPublicListsForUser(listsHelper, userid){
      this.process.client.users.fetch(userid).then(user => {
         let lists = listsHelper.getAllLists(user, true , true);
         if(lists){
            new DiscordJS.WebhookClient(this.process.client.user.id, this.interaction.token).send(lists);
         }else{
            new DiscordJS.WebhookClient(this.process.client.user.id, this.interaction.token).send("This user has no public lists");
         }
      });
   }


   showLists(listsHelper){
      this.process.client.users.fetch(this.userId).then(user => {
         let yourLists = listsHelper.getAllLists(user, false, true);
         let publiclists = listsHelper.getAllPublicLists(this.interaction.guild_id,true, user.id);

         let content = "\n **Your Lists:** \n" + yourLists + "\n **Public Lists:** \n" + publiclists; 
         new DiscordJS.WebhookClient(this.process.client.user.id, this.interaction.token).send(content);
      });
   }
}