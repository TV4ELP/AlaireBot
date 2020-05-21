const BasicCommand = require('./basicCommand.js');

module.exports = class KickUser extends BasicCommand{
 
    execute(){
        let mentions = this.getMentions();
        if(this.muteRoleId() == null){
            this.event.reply("There is no Role defined");
            return;
        }

        mentions.each(user => {
            if(this.isAlreadyMuted(user) == false){
                user.roles.add(this.muteRoleId(), "Muted by User " + this.user.displayName).then(guildUser => {
                    this.event.reply("Muted " + guildUser.displayName);
                });
            }
        });
    }

    isAlreadyMuted(user){
        return this.userHasRole(this.muteRoleId, user);
    }
}