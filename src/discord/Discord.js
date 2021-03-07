const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const DiscordJS = require('discord.js');
const fs = require('fs');
const permissionHelper = require('./permissionHelper');
const reactionHelper = require('./reactionHelper');
const roleHelper = require('./roleHelper');
const kickWatcher = require('./watcher/kickWatcher');
const loginWatcher = require('./watcher/loginWatcher');

module.exports = class Discord {
   constructor(db){
      this.mainDB = db;
      this.client = new DiscordJS.Client({
         partials : ['MESSAGE', 'CHANNEL', 'REACTION', "USER"],
      });
      this.RegisterEvents();
      this.StartWatcher();
      this.storagePath = this.mainDB.get('storagePath').value();
   }

   //Start all watcher that have to check if a certain time/condition has been met 
   StartWatcher(){
      let watcher = new kickWatcher(this.client);
      let login = new loginWatcher(this.client);

      watcher.watch();
      login.watch();
   }

   RegisterNewCommands(){
      this.client.api.applications(this.client.user.id).guilds('366942872219549697').commands.post({
         data: {
            name: "list",
            description: "All the lists",
            // possible options here e.g. options: [{...}]
            options: [
               {
                  name: "get",
                  description: "We want something back",
                  type: 2, //subgroup
                  options: [
                     {
                        name : "random",
                        description : "it could be anything",
                        type : 1,//subcommand
                        options : [
                           {
                              name : "ListName",
                              description : "What List shal it be from (empty for default)",
                              type : 3, //string
                              required : false
                           },
                           {
                              name : "Count",
                              description : "How Many pleb?",
                              type : 4, //Int
                              required : false
                           }
                        ] 
                     }/* Don't use that currently,
                     {
                        name : "by-name",
                        description : "you know what you are searching for",
                        type : 1,
                        options : [
                           {
                              name : "ImageName",
                              description : "How is it's precious name?",
                              type : 3,
                              required: true
                              
                           },
                           {
                              name : "ListName",
                              description : "What List shal it be from (empty for default)",
                              type : 3,
                              required : false
                           }
                        ]
                     }*/
                  ]
               },
               {
                  name: "add",
                  description: "Pls fill me up~",
                  type :1, 
                  options:[
                     {
                        name : "URL",
                        description : "The Image Link Please",
                        type : 3, //string
                        required : true
                     },
                     {
                        name : "ImageName",
                        description : "A name to find it better in the future?",
                        type : 3, //string
                        required : false
                     },
                     {
                        name : "ListName",
                        description : "What List shal it be from (empty for default)",
                        type : 3, //string
                        required : false
                     }
                  ]
               },
               {
                  name: "collection",
                  description: "Let me show you all of your lists",
                  type: 1 //subcommand
               },
               {
                  name: "manage",
                  description: "Managing is hard, this makes it easy",
                  type: 1 //subcommand
               }
            ]
         }
      });
   }


   UpdateSlashCommands(){
      let commandPromise = this.RemoveCommands();

      commandPromise.then(list => {
         list.forEach(element => {
            let commandId = element.id;
            this.client.api.applications(this.client.user.id).commands(commandId).delete();
         });
         this.RegisterNewCommands();
      });

      this.HandleInterActionEvents();
   }

   RemoveCommands(){
      return this.client.api.applications(this.client.user.id).commands.get();
   }

   HandleInterActionEvents(){
      this.client.ws.on('INTERACTION_CREATE', async interaction => {
         const command = interaction.data.name.toLowerCase();
         const args = interaction.data.options;
         let userId = interaction.member?.user.id;
         if(!userId){
            userId = interaction.user.id
         }
         const channel = this.client.channels.cache.get(interaction.channel_id);

         if (command === 'list'){ 
            this.HandleListCommandInternal(interaction, args, userId, channel);
         }
      });
   }

   HandleListCommandInternal(interaction, args, userId, channel){
      if(args.length == 0){
         return;
      }

      //Now Check if we wanna get or add
      let subGroup = args[0];
     
      if(subGroup.name === 'get'){
         let slashcommandListGetObj = new(require("./slashCommands/list-get"))(this, interaction, subGroup, userId, channel);
         slashcommandListGetObj.processSubGroup();           
      }

      if(subGroup.name === 'add'){
         let slashcommandListAddObj = new(require("./slashCommands/list-add"))(this, interaction, subGroup, userId, channel);
         slashcommandListAddObj.processSubGroup();           
      }

      if(subGroup.name === 'collection'){
         let slashcommandShowListsObj = new(require("./slashCommands/list-collection"))(this, interaction, subGroup, userId, channel);
         slashcommandShowListsObj.processSubGroup();           
      }

      if(subGroup.name === 'manage'){
         let slashcommandManageObj = new(require("./slashCommands/list-manage"))(this, interaction, subGroup, userId, channel);
         slashcommandManageObj.processSubGroup();           
      }
   }
   



   //Login to the Discord API and make sure we have everything needed to make calls to it
   Start(){
      //Slash Command Example. Maybe wait for an official implementation
      this.client.on('ready', () => {
         this.UpdateSlashCommands();
     });

      this.client.login(fs.readFileSync('discord.key', 'utf8').trim()).then( () => {
         //make sure we are actually logged in before we try to do anything
         console.log("Bot logged in")
         this.UpdateConfiguration();
      });
   }

   //Get all Guilds we are currently in
   GetAllGuilds(){
      const guildCollection = this.client.guilds.cache;
      return guildCollection;
   }

   //Make sure every Guild has all Commands and all Paths are correct
   UpdateConfiguration(){
      const guildCollection = this.GetAllGuilds();
      guildCollection.each((guild) => {
         //We forcefully cache every guild on the first run of the bot
         this.client.guilds.fetch(guild.id, true, true).then( (fetchedGuild) => {
            this.UpdateSingleGuildConfig(fetchedGuild);
         });
      });
   }

   //Update Commands and Files for a Single Guild
   UpdateSingleGuildConfig(guild){
      this.UpdateGuildDatabase(guild);

      let event = {guild :  guild}; //dummy Object
      let database = this.GetGuildStorage(event);
      let commands = this.GetAllCommands();
      this.UpdateCommands(database, commands); 
   }

   //Update the Storage Configs/Databases
   UpdateGuildDatabase(guild){
      let storagePath = this.storagePath + guild.id + '/';
      let storageFile = storagePath + 'config.json';

      //If there is no Folder, create it
      if(fs.existsSync(storagePath) == false){
         fs.mkdirSync(storagePath);
         let database = low(new FileSync(storageFile));
         //Create the BASE structure
         //forcedStart, with what charakter the bot executes basic commands
         database.defaults({commands : [], owner : guild.ownerID, forcedStart : '/'}).write();
      }

      this.UpdateDefaults(guild);
   }

   //Remove all Commands and add the new definitions
   UpdateCommands(guildDatabase, commandCollection){
      guildDatabase.get('commands').remove().write()
      this.mainDB.get('globalCommands').remove().write()
      commandCollection.forEach(value =>{
         //Skip global Commands
         if(value.defaults.global == true){
            this.mainDB.get('globalCommands').push(value.defaults).write();
         }
         guildDatabase.get('commands').push(value.defaults).write();
      });
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
         this.UpdateSingleGuildConfig(guild);
         //We need to add it manually here, because only available guilds at the start are watched, not new ones
         let watcher = new kickWatcher(this.client);
         watcher.watchSingleGuild(guild.id);
      });
   }

   //Handle the reaction based on the command specified in the Database for the ID
   HandleReaction(eventData, user, type){
      let commandName = type == "ADD" ? "addRole.js" : "removeRole.js";
      let message = eventData.message;
      let serverStorage = this.GetGuildStorage(message);
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

   //Dynamically Create and execute a commandclass
   HandleTextEvent(messageEvent, user){
      let content = messageEvent.content; 
      let serverStorage = this.GetGuildStorage(messageEvent); //Get the Databse for the Guild
      this.GetCommandFromMessageContent(content, serverStorage).then(commandObj => { //try to find a command
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

   //Update all the necessary info for a guild 
   UpdateDefaults(guild){
      let object = {guild : guild};
      let database = this.GetGuildStorage(object);

      let guildId = guild.id;
      let storagePath = this.storagePath + guildId + '/';
      let mutedDatabaseFilePath = storagePath + 'muted.json';

      let roleManager = guild.roles;
      let roles = roleManager.cache;
      let role = roles.find(role => role.name == "Muted");
      role == null ? this.CreateMuteRole(roleManager, database) : database.set('muterole', role.id).write();
      
      //Database for all Muted Member.
      //currentlymuted = memberId => {timestamp, timeinseconds}
      //mutedCount = memberID => int
      if(fs.existsSync(mutedDatabaseFilePath) == false){
         let mutedDatabse = low(new FileSync(mutedDatabaseFilePath));
         mutedDatabse.defaults({currentlyMuted : [], mutedCount : []}).write();
      }
      
      database.set('muteDatabasePath', mutedDatabaseFilePath).write();

      let reactionHlp = new reactionHelper(this.client, guildId, this.mainDB);
      reactionHlp.setupDBForGuild();

      let permissionHelperObj = new permissionHelper(this.client, guildId, this.mainDB);
      permissionHelperObj.setupDBForGuild();

      let roleHelperObj = new roleHelper(this.client, guildId, this.mainDB);
      roleHelperObj.setupDBForGuild();
      
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
   GetCommandFromMessageContent(contentString, serverStorage){
      let commandPromise = new Promise((resolve, reject) => {
         let contenStringUP = contentString.toUpperCase();
         let commands = [];
         let guildCommands = serverStorage?.get('commands').value();
         if(guildCommands != null){
            commands = commands.concat(guildCommands);
         }
         commands = commands.concat(this.mainDB.get('globalCommands').value());
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
   GetGuildStorage(event){
      let guild = event.guild;

      //no guild, no doing stuff
      if(guild == null || guild.available == false){
         return null;
      }

      let storageFile = 'storage/' + guild.id + '/config.json';
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
            let requirePath = './commands/' + value + '/command.js';
            if(fs.existsSync(path + value + "/command.js")){
               let obj = require(requirePath);
               defaults.push(obj);
            }
            
         }
      });
      return defaults;
   }
}