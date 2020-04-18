const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const DiscordJS = require('discord.js');

module.exports = class Discord {
    constructor(db){
        this.mainDB = db;
        this.client = new DiscordJS.Client({partials : ['MESSAGE', 'CHANNEL', 'REACTION']});
        this.RegisterEvents();
    }

    Start(){
        this.client.login('NTg2OTE1NzY5NDkzODgwODQy.XpsVew.EFNs9EnYSZry687ZBS4RJhGToJA')
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
                return false;
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

    GetParamsFromReaction(reaction, type){
        let params = {};
        params.type = type == "REACTIONADD" ? true : false;

        return params;
    }
}