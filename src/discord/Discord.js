const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const DiscordJS = require('discord.js');
const fs = require('fs');
const permissionHelper = require('./permissionHelper')

module.exports = class Discord {
   constructor(db){
      this.mainDB = db;
      this.client = new DiscordJS.Client({partials : ['MESSAGE', 'CHANNEL', 'REACTION']});
      this.RegisterEvents();
      this.StartWatcher();
   }

   StartWatcher(){
      let watcher = new(require('./watcher/kickWatcher.js'))(this.client);
      watcher.watch();
   }

   Start(){
      this.client.login(fs.readFileSync('discord.key', 'utf8'))
   }

   //Get all Events and then shoot them off to the next steop
   RegisterEvents(){
      this.client.on('messageReactionAdd', async(reaction, user) => {
         //IF we have any uncached Data, make sure we get all the info we need. 
         //This allows us to listen for old message reactions after a restart of the bot
         if(reaction.message.partial) await reaction.message.fetch();
         if(reaction.partial) await reaction.fetch();
         this.ProcessEvent(reaction, user, 'REACTIONADD');
      });

      this.client.on('messageReactionRemove', async(reaction, user) => {
         if(reaction.message.partial) await reaction.message.fetch();
         if(reaction.partial) await reaction.fetch();
         this.ProcessEvent(reaction, user, 'REACTIONREMOVE');
      });

      this.client.on('message', async(message, user) => {
         //IF a message added shouldn't be cached for any weird reason.
         //Just gets rid of potential errors down the line
         if(message.partial) await message.fetch();
         this.ProcessEvent(message, message.author, 'MESSAGE');
      });

      //Guild join is never partial
      this.client.on('guildCreate', async(guild) => {
         this.CreateDefaults(guild);
      });

   }

   ProcessEvent(eventData, user, type){
      let command = this.FindAndProcessCommand(type, eventData, user);       
   }

   //Based on the command we need to do different things
   FindAndProcessCommand(type, eventData, user, retry = false){
      let command = "";
      let serverStorage = this.GetServerStorage(eventData);
      switch (type) {
         case "REACTIONADD":{
               command += "Reactionadd";
               break;
         }

         case "REACTIONREMOVE":{
               params = this.GetParamsFromReaction(eventData, type);
               command += "ReactionRemove";
               break;
         }  

         case "MESSAGE":{
               //Handle Messages
               let content = eventData.content;
               if(eventData.author.bot){
                  break; //Just die here, no need to do shit when you are a bot
               }
               this.GetCommandFromMessageContent(content, serverStorage).then(commandObj => {
                  let params = this.GetParamsFromMessage(eventData, commandObj)
                  let commandClass = new(require('./commands/' + commandObj.filePath).classObj)(this, eventData, user, serverStorage, params); //Create a new CommandObject with the Client inserted.
                  commandClass.execute();
               }).catch(errorObj => {
                  this.HandleProcessCommandError(errorObj, type, eventData, user, serverStorage);
               });
         }

         default:{
               command + "default";
               break;
         }
      }
      return command += ".js";
   }

   HandleProcessCommandError(errorObj, type, eventData, user, serverStorage){
      if(errorObj.message.includes('NOT FOUND')){
         //lets try to get the command if it doesn't exist
         if(retry == false){
            let commands = this.GetAllCommands();
            commands.forEach(value =>{
               serverStorage.get('commands').remove({filePath: value.defaults.filePath}).write();
               serverStorage.get('commands').push(value.defaults).write();
            });
            this.FindAndProcessCommand(type, eventData, user, true);
         }else{
            eventData.reply("Me no knowing what dis means");
         }
      }else{
         eventData.reply("Uhmmm... i'm not feeling so well... i notified a doctor already");
         let cache = this.client.users.cache;
         cache.get('147011778637856768').createDM().then(dmChannel => { //inform me please
            dmChannel.send(errorStr.message);
         });
      }
      console.log(errorStr);
   }

   CreateDefaults(guild){
      let object = {guild : guild};
      let database = this.GetServerStorage(object);

      let guildId = guild.id;
      let storagePath = 'storage/' + guildId + '/';
      let mutedDatabaseFilePath = storagePath + 'muted.json';
      let reactionDatabaseFilePath = storagePath + 'reactions.json';
      

      //get all commands and fill in
      let commands = this.GetAllCommands();
      commands.forEach(value =>{
         database.get('commands').push(value.defaults).write();
      });
      let roleManager = guild.roles;
      let roles = roleManager.cache;
      let role = roles.find(role => role.name == "Muted");
      if(role == null){
         roleManager.create({
               data: {
                  name: 'Muted',
                  color: 'BLUE',
               },
               reason: 'Bot initialisation for role',
         }).then(newRole => {
               database.set('muterole', newRole.id).write();
         });
      }else{
         database.set('muterole', role.id).write();
      }
      
      //Database for all Muted Member.
      //currentlymuted = memberId => {timestamp, timeinseconds}
      //mutedCount = memberID => int
      let mutedDatabse = low(new FileSync(mutedDatabaseFilePath));
      mutedDatabse.defaults({currentlyMuted : [], mutedCount : []}).write();
      database.set('muteDatabasePath', mutedDatabaseFilePath).write();
      
      //We need to add it manually here, because only all available guild at the start are watched, not new ones
      let watcher = new(require('./watcher/kickWatcher.js'))(this.client);
      watcher.watchSingleGuild(guildId);

      let reactionDB = low(new FileSync(reactionDatabaseFilePath));
      reactionDB.defaults({reaction : [], roleAndEmote : []}).write();
      database.set('reactionDatabasePath', reactionDatabaseFilePath).write();

      let permissionHelperObj = new permissionHelper(this.client, guildId, this.mainDB);
      permissionHelperObj.setupPermissionDBForGuild();
   }

   //Get all parameter from a message
   GetParamsFromMessage(message, commandObj){
      //first lets remove the command from the content
      let content = message.content;
      content = content.replace(commandObj.name,'');
      //we already handel mentions in the basicCommand, so out with those too
      content = content.replace(/<@.*?>/g, '').trim();
      //Now we have the mostly clean message (hopefully)
      //Arguments (for now) are space separated
      let args = content.match(/[^\s"]+|"([^"]*)"/ig);
      return args;
   }

   //Returns a Promise with the command or Error
   //TODO check for forcedstart
   GetCommandFromMessageContent(contentString, serverStorage){
      let commandPromise = new Promise((resolve, reject) => {
         let contenStringUP = contentString.toUpperCase();
         let commands = serverStorage.get('commands').value();
         for(let i in commands){
               let name = commands[i].command.toUpperCase();
               let enabled = commands[i].enabled;
               if(contenStringUP.includes(name) && enabled){
                  resolve(commands[i]);
               }
         }

         let exceptionObj = {
            message : 'COMMAND NOT FOUND:' + contentString
         };
         reject(exceptionObj);

      });

      return commandPromise;
   }

   //We need the Database for the Sprcific Server
   //Create if not Found
   GetServerStorage(event){
      let guild = event.guild;

      //no guild, no doing stuff
      if(guild == null){
         return null;
      }
      if(guild.available == false){
         return null;
      }

      let guildId = guild.id;
      let storagePath = 'storage/' + guildId + '/';
      let storageFile = storagePath + 'config.json';

      //If no Databse exists we need to create it.
      if(fs.existsSync(storagePath) == false){
         fs.mkdirSync(storagePath);
         let database = low(new FileSync(storageFile));
         //Create the BASE structure
         //forcedStart, with what charakter the bot executes basic commands
         database.defaults({commands : [], owner : guild.ownerID, forcedStart : '/'}).write();
         return database;
      }

      return low(new FileSync(storageFile));
   }

   //All default values like name and path
   // defauls / class
   GetAllCommands(){
      let defaults = [];
      let path = 'src/discord/';
      let dirContent = fs.readdirSync(path + 'commands');
      dirContent.forEach((value, key) => {
         let obj = require('./commands/' + value);
         defaults.push(obj);
      });
      return defaults;
   }

   GetParamsFromReaction(reaction, type){
      let params = {};
      params.type = type == "REACTIONADD" ? true : false;

      return params;
   }
}