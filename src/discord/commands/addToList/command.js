const BasicCommand = require('../basicCommand.js').classObj;

const defaults = {
   command : "/list add",
   filePath : __dirname,
   forcedStart : true,
   enabled : true,
   global : true,
   permissions : [],
   params : '/list add name** URL (Omit URL if direct Upload) **Without a name it goes to the Default list'
};

module.exports.defaults = defaults;
module.exports.classObj = class createNewList extends BasicCommand{

   constructor(discord, eventData, user, database, params){
      super(discord, eventData, user, database, params); //call parent
   }

   execute(){
      let name = null;
      let urlList = Array();
      let media = this.event.attachments;

      this.params?.forEach(element => {
         try {
            new URL(element);
         } catch (_) {
            name = element;
            return; //next one
         }

          urlList.push(element);
      });

      //No Media, sadlife
      if(media.size == 0 && urlList.length == 0){
         this.replyBad('You didn\'t gave me a Link or a direct Upload');
         return;
      }

      let listsHelper = this.getListsHelper();
      let result = listsHelper.getDatabaseByname(name, this.user)
      if(result && name == null){
         this.event.channel.send('Added to default list');
      }else{
         this.event.channel.send('Added to ' + name);
      }

      let linkList = this.getMediaLinkArray(urlList, media);
      linkList.forEach(elementLink => {
         result.get('images').push(elementLink).write();
      });
      //In any case, we are done here
      return;
      
   }

   getMediaLinkArray(urlList, mediaCollection){
      let list = Array();
      //We have media, Ignore URLS
      mediaCollection.each(attachment => {
         list.push(attachment.url);
      });
         
      list = list.concat(urlList);

      return list;
   }
}