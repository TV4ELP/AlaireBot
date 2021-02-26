const listHelper = require("../listHelper");
const slashcommandListAdd = require("./list-add");

module.exports = class slashcommandShowLists extends slashcommandListAdd{

   constructor(process, interaction, args, userId, channel){
      super(process, interaction, args, userId, channel)
   }
 
   processSubGroupShow(){
      let listsHelper = new listHelper(this.process.client, this.process.mainDB);
      this.showLists(listsHelper);
      return; //Always end and avoid useless checks
   }

   showLists(listsHelper){
      this.process.client.users.fetch(this.userId).then(user => {
         let lists = listsHelper.getAllLists(user);
         this.process.client.api.interactions(this.interaction.id, this.interaction.token).callback.post({data: {
            type: 4,
            data : {
               content: lists
            }
         }
         });
      });
   }
}