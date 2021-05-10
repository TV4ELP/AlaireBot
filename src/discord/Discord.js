const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const DiscordJS = require('discord.js');
const fs = require('fs');
const permissionHelper = require('./permissionHelper');
const reactionHelper = require('./reactionHelper');
const roleHelper = require('./roleHelper');
const kickWatcher = require('./watcher/kickWatcher');
const loginWatcher = require('./watcher/loginWatcher');
const listHelper = require('./listHelper');

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
      this.client.api.applications(this.client.user.id).commands.post({
         data: {
            name: "list",
            description: "All the lists",
            // possible options here e.g. options: [{...}]
            options: [
               {
                  name: "get",
                  description: "Post a random Image from your List (Without Listname it uses the default list)",
                  type: 1,//subcommand
                  options: [
                     {
                        name : "listname",
                        description : "Omit this to use your default list. Check what lists you have with '/list collection'",
                        type : 3, //string
                        required : false
                     },
                     {
                        name : "user",
                        description : "OPTIONAL: The User you want to get the list from (if it is public)",
                        type : 6, //Dis a user
                        required : false
                     },
                     {
                        name : "count",
                        description : "How many images? Max 5. Omit for just one",
                        type : 4, //Int
                        required : false
                     }
                  ]
               },
               {
                  name: "add",
                  description: "Add a new Image to your list",
                  type :1, 
                  options:[
                     {
                        name : "url",
                        description : "The Image Link Please",
                        type : 3, //string
                        required : true
                     },
                     {
                        name : "listname",
                        description : "Omit for your default list. Named Lists get created if they don't exist.",
                        type : 3, //string
                        required : false
                     },
                     {
                        name : "imagename",
                        description : "A name to hopefully find it again",
                        type : 3, //string
                        required : false
                     }
                  ]
               },
               {
                  name: "new",
                  description: "Create a new Empty List",
                  type: 1, //subcommand
                  options: [
                     {
                        name : "listname",
                        description : "The Name",
                        type : 3, //string
                        required : true
                     }
                  ]
               },
               {
                  name: "collection",
                  description: "Let me show you all the lists",
                  type: 1, //subcommand
                  options: [
                     {
                        name : "user",
                        description : "OPTIONAL: The User you want to get the list from (if it is public)",
                        type : 6, //Dis a user
                        required : false
                     }
                  ]
               },
               {
                  name: "manage",
                  description: "Managing is hard, this makes it easy",
                  type: 1 //subcommand
               },
               {
                  name: "make-public",
                  description: "Make your list publicly available for everyone to see",
                  type: 1, //subcommand
                  options: [
                     {
                        name : "listname",
                        description : "Check what lists you have with '/list collection'",
                        type : 3, //string
                        required : true
                     }
                  ]
               }
            ]
         }
      });
   }

   GuildSpecificCommands(){

      let guilds = this.GetAllGuilds();

      guilds.each((guild) => {
         this.UpdateSingleGuildListRanking(guild.id);
      });
   }

   UpdateSingleGuildListRanking(guildId){
      let listsHelper = new listHelper(this, this.mainDB);
      this.client.guilds.fetch(guildId, true, true).then( (fetchedGuild) => {
         let choicesArray = Array();
         let members = fetchedGuild.members.cache;
         let allLists = Array();

         members.forEach(guildMember => {
            let lists = listsHelper.getAllLists(guildMember.user, true);
            lists?.forEach(listElement => {
               allLists.push({name : listElement.name, count : listElement.count});
            });
         });

         allLists.sort((a,b) => (a.count > b.count) ? -1 : ((b.count > a.count) ? 1 : 0))
         let count = 0;
         allLists.forEach(listElement => {
            if(count < 25){
               let listelementName = listElement.name.split(' ').join('_');
               choicesArray.push({name : listelementName + " - " + " used " + listElement.count + " times", value : listElement.name});
               count ++;
            }
         });

         let commandPromise = this.client.api.applications(this.client.user.id).guilds(fetchedGuild.id).commands().get();
         commandPromise.then(list => {
            //delete if needed
            if(list.length > 0){
               list.forEach(element => {
                  let commandId = element.id;
                  this.client.api.applications(this.client.user.id).guilds(fetchedGuild.id).commands(commandId).delete().then( () => {
                     this.client.api.applications(this.client.user.id).guilds(fetchedGuild.id).commands.post({
                        data: {
                           name: "r",
                           description: "Direct access to the top Public Lists",
                           options: [
                              {
                                  name: "name",
                                  description: "The name of the list",
                                  type: 3,
                                  required: true,
                                  choices: choicesArray
                              }
                           ]
                        }
                     });
                  });
               });
            }else{
               this.client.api.applications(this.client.user.id).guilds(fetchedGuild.id).commands.post({
                  data: {
                     name: "r",
                     description: "Direct access to the top Public Lists",
                     options: [
                        {
                            name: "name",
                            description: "The name of the list",
                            type: 3,
                            required: true,
                            choices: choicesArray
                        }
                     ]
                  }
               });
            }
         });
      });
   }


   UpdateSlashCommands(){
      let commandPromise = this.RemoveCommands();

      commandPromise.then(list => {
         list.forEach(async element => {
            let commandId = element.id;
            await this.client.api.applications(this.client.user.id).commands(commandId).delete();
         });
         this.RegisterNewCommands();
      });
     
      this.GuildSpecificCommands();

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

         if (command === 'list' ){ 
            this.HandleListCommandInternal(interaction, args, userId, channel);
         }

         if (command === 'r' ){ 
            let slashcommandListGetPublic = new(require("./slashCommands/public-get"))(this, interaction, args, userId, channel);
            slashcommandListGetPublic.processSubGroup();
         }

         if (command === 'help'){
            this.client.users.fetch(userId).then(user => {
               const allCommands = this.GetAllCommands();
               let embed = this.createHelpEmbed(allCommands, interaction.guild_id, user);
               this.client.api.interactions(interaction.id, interaction.token).callback.post({
                  data: {
                     type: 4,
                     data : {
                        embeds : [embed.toJSON()]
                     }
                  }
               });
            });
            
         }
      });
   }


   createHelpEmbed(commandList, guildId, member){
      //First Create a message/embed we can react to
      let embed = new DiscordJS.MessageEmbed();
      embed.setTitle('You need help? I have help');
      embed.setAuthor('Alaire', 'https://cdn.discordapp.com/avatars/586915769493880842/35e9c9874d02e256c5b702e003688937.png'); //Name, Icon
      embed.setDescription('Here are all the commands i know');

      let hiddenCounter = 0;
      commandList.forEach(value =>{
         if(!value.defaults.enabled || value.defaults.command == '') {
            return;
         }

         let permissionArray = value.defaults.permissions;
         let commandName = value.defaults.command;
         let params = value.defaults.params;

         //If we are not allowed, abort, but count it
         const permissionsHelper = new permissionHelper(this, guildId, this.mainDB)
         let allowed = permissionsHelper.isCommandAllowed(permissionArray, member);
         if(allowed == false){
            hiddenCounter ++;
            return;
         }
         
         if(params == ''){
            params = "No input required";
         }

         if(permissionArray.length > 0){
            commandName += " (Needed Permissions: " + permissionArray.toString() + ")"; 
         }

         embed.addField(commandName, params, false); //Title, Content, Inline 
      });

      if(hiddenCounter > 0){
         embed.setFooter('You have missing permissions to see ' + hiddenCounter + ' additional Commands');
      }
      
      return embed;
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

      if(subGroup.name === 'make-public'){
         let slashcommandShare = new(require("./slashCommands/list-make-public"))(this, interaction, subGroup, userId, channel);
         slashcommandShare.processSubGroup();           
      }

      if(subGroup.name === 'new'){
         let slashcommandNew= new(require("./slashCommands/list-new"))(this, interaction, subGroup, userId, channel);
         slashcommandNew.processSubGroup();           
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