const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const DiscordJS = require('discord.js');
const fs = require('fs');;

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
    }

    ProcessEvent(eventData, user, type){
        let command = this.FindAndProcessCommand(type, eventData, user);       
    }

    //Based on the command we need to do different things
    FindAndProcessCommand(type, eventData, user){
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
                this.GetCommandFromMessageContent(content, serverStorage).then(commandObj => {
                    let params = this.GetParamsFromMessage(eventData, commandObj)
                    let commandClass = new(require('./commands/' + commandObj.filePath))(this, eventData, user, serverStorage, params); //Create a new CommandObject with the Client inserted.
                    commandClass.execute();
                }).catch(errorStr => {
                    console.log(errorStr);
                });
            }

            default:{
                command + "default";
                break;
            }
        }
        return command += ".js";
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
                let name = commands[i].name.toUpperCase();
                if(contenStringUP.includes(name)){
                    resolve(commands[i]);
                }
            }

            reject('COMMAND NOT FOUND:' + contentString);

        });

        return commandPromise;
    }

    //We need the Database for the Sprcific Server
    //Create if not Found
    GetServerStorage(event){
        let guild = event.guild;
        if(guild.available == false){
            return null;
        }

        let guildId = guild.id;
        let storagePath = 'storage/' + guildId + '/';
        let storageFile = storagePath + 'config.json';
        let mutedDatabaseFilePath = storagePath + 'muted.json';

        //If no Databse exists we need to create it.
        if(fs.existsSync(storagePath) == false){
            fs.mkdirSync(storagePath);
            let database = low(new FileSync(storageFile));
            //Create the BASE structure
            //forcedStart, with what charakter the bot executes basic commands
            database.defaults({commands : [], owner : guild.ownerID, forcedStart : '/'}).write();
            database.get('commands').push({name : '/kick', filePath : 'kickUser.js', forcedStart : true}).write();

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
            database.set('muteDatabsePath', mutedDatabaseFilePath).write();
            return database;
        }

        return low(new FileSync(storageFile));
    }

    GetParamsFromReaction(reaction, type){
        let params = {};
        params.type = type == "REACTIONADD" ? true : false;

        return params;
    }
}