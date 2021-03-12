const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");

module.exports = class slashcommandListManage extends slashcommandListAdd {

   constructor(process, interaction, args, userId, channel){
      super(process, interaction, args, userId, channel)
   }
 
   //Generate Link with UserID and one time login pass
   processSubGroup(){
      this.process.client.users.fetch(this.userId).then(user => {
         let listsHelper = new listHelper(this.process.client, this.process.mainDB);
         let login = listsHelper.createLoginForUser(user);
         let url = listsHelper.loginUrl(login, user);
         this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({
            data: {
               type: 4,
               data : {
                  content: "This is only visible to you, here is your Login \n" + url,
                  flags: 64 //ephemeral aka, only you can see it
               }
            }
         });
      }); 
   }

}