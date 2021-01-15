const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const DiscordJS = require('discord.js');
const fs = require('fs');
const permissionHelper = require('./permissionHelper');
const reactionHelper = require('./reactionHelper');
const kickWatcher = require('./watcher/kickWatcher');

module.exports = class Discord {
   constructor(db){
      this.mainDB = db;
      this.client = new DiscordJS.Client({
         partials : ['MESSAGE', 'CHANNEL', 'REACTION', "USER"]         
      });
      this.RegisterEvents();
      this.StartWatcher();
      this.storagePath = 'storage/';
   }

   StartWatcher(){
      let watcher = new kickWatcher(this.client);
      watcher.watch();
   }

   Start(){
      this.client.login(fs.readFileSync('discord.key', 'utf8'));
      //If we migrated or moved folders around or renamed them, make sure they still work
      this.UpdatePaths();
   }

   //Update all Paths for all Guilds, in case something happend between starts
   UpdatePaths(){

      let dirs = fs.readdirSync(this.storagePath);
      for(let i = 0; dirs.length > i; i++){
         let dir = dirs[i];
         if(!isNaN(dir)){
            let event = {guild : {id : dir}}; //dummy Object
            let database = this.GetServerStorage(event, false);
            let commands = this.GetAllCommands();
            commands.forEach(value =>{
               let commandObj = database.get('commands').find({command : value.defaults.command}); //Delete them just to be on the safe side
               if(commandObj){
                  commandObj.update('filePath', () => value.defaults.filePath).write();
               }
            });
         }
      }
      

      
   }

   //Get all Events and then shoot them off to the next step
   RegisterEvents(){
      this.client.on('messageReactionAdd', async(reaction, user) => {
         //This allows us to listen for old message reactions after a restart of the bot
         if(reaction.partial) await reaction.fetch();
         if(user.partial) await user.fetch();
         if(reaction.message.partial) await reaction.message.fetch();
         this.HandleReaction(reaction, user, "ADD");
      });

      this.client.on('messageReactionRemove', async(reaction, user) => {
         if(reaction.partial) await reaction.fetch();
         if(user.partial) await user.fetch();
         if(reaction.message.partial) await reaction.message.fetch();
         this.HandleReaction(reaction, user, "REMOVE");
      });

      this.client.on('message', async(message) => {
         if(message.partial) await message.fetch();
         if(!message.author.bot){
            if(message.author.partial) await user.fetch();
            let user = message.author;
            this.HandleTextEvent(message, user);
         }
      });

      //Guild join is never partial if it would be, i would be sad
      this.client.on('guildCreate', async(guild) => {
         this.CreateDefaults(guild);
      });
   }

   HandleReaction(eventData, user, type){
      let commandName = type == "ADD" ? "addRole.js" : "removeRole.js";
      let message = eventData.message;
      let serverStorage = this.GetServerStorage(message);
      let reactionHlp = new reactionHelper(this, message.guild.id, this.mainDB);
      let reaction = reactionHlp.getReactionInDB(message.id);
      if(reaction){
         let params = {messageId: message.id, emote: eventData.emoji};
         try {
            let commandClass = new(require(reaction.dir + '/' + commandName).classObj)(this, eventData, user, serverStorage);
            commandClass.setCustomParams(params);
            commandClass.execute();
         } catch (error) {
            console.log(error.message);
         }
      }
   }

   HandleTextEvent(messageEvent, user){
      let content = messageEvent.content;
      let serverStorage = this.GetServerStorage(messageEvent);
      this.GetCommandFromMessageContent(content, serverStorage).then(commandObj => {
         let path = commandObj.filePath + '/command.js';
         let commandClass = new(require(path).classObj)(this, messageEvent, user, serverStorage); //Create a new CommandObject with the Client inserted.
         //Preconfigure Params
         commandClass.getParamsFromMessage(messageEvent, commandObj);
         commandClass.execute();
      }).catch(errorObj => {
         this.HandleProcessCommandError(errorObj, messageEvent);
      });
   }


   //This never works and kinda spams me... i don't know why and i don't care. I blocked the Bot *shrugs*
   HandleProcessCommandError(errorObj, eventData){
      if(errorObj.message.includes('NOT FOUND')){
         //eventData.reply("Me no knowing what dis means"); 
      }else{
         if(errorObj.message.author != null){
            if(errorObj.message.author.bot){
               return;
            }
         }
         eventData.reply("Uhmmm... i'm not feeling so well... i notified a doctor already");
         let cache = this.client.users.cache;
         cache.get('147011778637856768').createDM().then(dmChannel => { //inform me please
            dmChannel.send(errorObj.stack);
         });
      }
   }

   CreateDefaults(guild){
      let object = {guild : guild};
      let database = this.GetServerStorage(object, false);

      let guildId = guild.id;
      let storagePath = this.storagePath + guildId + '/';
      let mutedDatabaseFilePath = storagePath + 'muted.json';

      //get all commands and fill in
      let commands = this.GetAllCommands();
      commands.forEach(value =>{
         database.get('commands').remove({filePath: value.defaults.filePath}).write(); //Delete them just to be on the safe side
         database.get('commands').push(value.defaults).write();
      });

      let roleManager = guild.roles;
      let roles = roleManager.cache;
      let role = roles.find(role => role.name == "Muted");
      role == null ? this.CreateMuteRole(roleManager, database) : database.set('muterole', role.id).write();
      
      //Database for all Muted Member.
      //currentlymuted = memberId => {timestamp, timeinseconds}
      //mutedCount = memberID => int
      let mutedDatabse = low(new FileSync(mutedDatabaseFilePath));
      mutedDatabse.defaults({currentlyMuted : [], mutedCount : []}).write();
      database.set('muteDatabasePath', mutedDatabaseFilePath).write();
      
      //We need to add it manually here, because only available guilds at the start are watched, not new ones
      let watcher = new kickWatcher(this.client);
      watcher.watchSingleGuild(guildId);

      let reactionHlp = new reactionHelper(this.client, guildId, this.mainDB);
      reactionHlp.setupPermissionDBForGuild();

      let permissionHelperObj = new permissionHelper(this.client, guildId, this.mainDB);
      permissionHelperObj.setupPermissionDBForGuild();
   }

   CreateMuteRole(roleManager, database){
      roleManager.create({
         data: {
            name: 'Muted',
            color: 'BLUE',
         },
         reason: 'Bot initialisation for role',
      }).then(newRole => {
            database.set('muterole', newRole.id).write();
      });
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
               if(contenStringUP.includes(name) && enabled && name != ''){
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
   GetServerStorage(event, setup = true){
      let guild = event.guild;

      //no guild, no doing stuff
      if(guild == null || guild.available == false){
         return null;
      }

      let storagePath = 'storage/' + guild.id + '/';
      let storageFile = storagePath + 'config.json';

      //If no Databse exists we need to create it.
      if(fs.existsSync(storagePath) == false){
         fs.mkdirSync(storagePath);
         let database = low(new FileSync(storageFile));
         //Create the BASE structure
         //forcedStart, with what charakter the bot executes basic commands
         database.defaults({commands : [], owner : guild.ownerID, forcedStart : '/'}).write();
         //If we are already in the setup, dont't do it again
         if(setup){
            this.CreateDefaults(guild);
         }
         return database;
      }
      return low(new FileSync(storageFile));
   }

   //All default values like name and path
   // defauls / class
   GetAllCommands(){
      let defaults = [];
      let path = 'src/discord/commands/';
      let commandsFolder = fs.readdirSync(path);
      commandsFolder.forEach((value, key) => {
         let newPath = path + value;
         if(fs.lstatSync(newPath).isDirectory()){
            let obj = require('./commands/' + value + '/command.js');
            defaults.push(obj);
         }
      });
      return defaults;
   }
}