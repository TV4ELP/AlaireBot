const BasicCommand = require('./basicCommand.js');

module.exports = class KickUser extends BasicCommand{

    constructor(discord, eventData, user, database){
        super(discord, eventData, user, database); //call parent
        this.duration = 10 * 1000; //10 seconds
    }
 
    execute(){
        let mentions = this.getMentions();
        if(this.muteRoleId() == null){
            this.event.reply("There is no Role defined");
            return;
        }

        mentions.each(user => {
            if(this.isAlreadyMuted(user) == false){
                user.roles.add(this.muteRoleId(), "Muted by User " + this.user.displayName)
                .then(() => this.event.channel.send("Muted " + user.displayName))
                .then(() => this.handleMute(user));
            }else{
                this.event.channel.send("Already muted " + user.displayName);
            }
        });
    }

    isAlreadyMuted(user){
        return this.userHasRole(this.muteRoleId(), user);
    }

    handleMute(guildMember){
        let muteBase = this.muteDatabase();
        let museUser = muteBase.get('currentlyMuted');
        let user = museUser.find({ id : guildMember.id}).value();
        if(user == null){
            let muteObj = {
                id : guildMember.id,
                timestamp : Date.now(),
                duration : this.duration
            };

            museUser.push(muteObj).write();
        }
    }
}