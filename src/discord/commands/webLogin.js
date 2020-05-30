const BasicCommand = require('./basicCommand.js').classObj;
const defaults = {
    command : "/login",
    filePath : "webLogin.js",
    forcedStart : true,
    enabled : false,
    permissions : [
        "admin"
    ]
};
module.exports.defaults = defaults;
module.exports.classObj = class webLogin extends BasicCommand{

    constructor(discord, eventData, user, database, params){
        super(discord, eventData, user, database, params); //call parent

    }
 
    execute(){
        if(this.isAdmin(this.user)){
            let guildId = this.getGuildFromMessage().id;
            let databaseLogin = this.database.get('loginToken').value();
            //generate a login key if we dont have one
            if(databaseLogin == null){
                let crypto = require('crypto');
                databaseLogin = crypto.randomBytes(20).toString('hex');
                this.database.set('loginToken', databaseLogin).write();
            }

            this.user.send("Please Login under pegasi-strategy.de:3000/" + guildId + " With the loginCode:" + databaseLogin);
        }
    }
}