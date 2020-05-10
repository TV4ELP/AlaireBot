const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const DiscordJS = require('discord.js');
const fs = require('fs');;

module.exports = class Discord {
    constructor(db){
        this.mainDB = db;
        this.client = new DiscordJS.Client({partials : ['MESSAGE', 'CHANNEL', 'REACTION']});
        this.RegisterEvents();
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
            this.ProcessEvent(message, user, 'MESSAGE');
        });
    }

    ProcessEvent(eventData, user, type){
        let command = this.FindCommand(type, eventData);
        let params = "";
        if(type === "MESSAGE"){
            params = this.GetParamsFromMessage(eventData)
        }
        if(type === "REACTIONADD" || type === "REACTIONREMOVE"){
            params = this.GetParamsFromReaction(eventData, type);
        }

        let commandObj = new(require('./commands/' + command))(this); //Create a new CommandObject with the Client inserted. 
    }

    //Based on the command we need to do different things
    FindCommand(type, eventData){
        let command = "";
        let serverStorage = this.GetServerStorage(eventData);
        switch (type) {
            case "REACTIONADD":{
                command += "Reactionadd";
                break;
            }

            case "REACTIONREMOVE":{
                command += "ReactionRemove";
                break;
            }  

            case "MESSAGE":{
                //Handle Messages
                let content = eventData.content;
                command += this.GetCommandFromMessageContent(content, serverStorage).then();
                // umbauen Sodass das Promise direkt den Command Später auslöst
            }

            default:{
                command + "default";
                break;
            }
        }
        return command += ".js";
    }


    GetParamsFromMessage(message){

    }

    //Returns a Promise with the command or Error
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

        //If no Databse exists we need to create it.
        if(fs.existsSync(storagePath) == false){
            fs.mkdirSync(storagePath);
            let database = low(new FileSync(storageFile));
            //Create the BASE structure
            database.defaults({commands: [], owner : guild.ownerID, forcedStart : '/'}).write();
            database.get('commands').push({name : '/kick', filePath : 'kickUser'}).write();
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