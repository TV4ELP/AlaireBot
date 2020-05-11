module.exports = class BasicCommand {
    constructor(discord, eventData, user){
        this.client = discord.client;
        this.event = eventData;
        this.user = user;
    }

    execute(){
        this.event.reply("HI").then( () => {
            console.log("sendCommand");
        }).catch(() => {
            console.log("error");
        });
    }
}