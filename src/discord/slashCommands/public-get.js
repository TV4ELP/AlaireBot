const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");
const DiscordJS = require('discord.js');

module.exports = class slashcommandListGetPublic extends slashcommandListAdd {

   constructor(process, interaction, args, userId, channel){
      super(process, interaction, args, userId, channel)
   }
 
   processSubGroup(){

      let listName = this.args[0].value;

      //Instantly respond with a "waiting"
      this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
         data: {
            type: 5,
         }
      });

      //Now finish the respons up
      
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);

      let text = "";
      let member = listsHelper.getUserFromListAndGuild(this.interaction.guild_id, listName);
      let image = listsHelper.getRandomImage(member.user, listName);
      if(image){
         text = image.url;
         listsHelper.incrementListCounter(member.user, listName);
         this.process.UpdateSingleGuildListRanking(this.interaction.guild_id);
      }else{
         text = "There are currently no images in that List"
      }
      
      new DiscordJS.WebhookClient(this.process.client.user.id, this.interaction.token).send(text);
   }

}