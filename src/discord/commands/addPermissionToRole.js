const BasicCommand = require('./basicCommand.js').classObj;
const defaults = {
    command : "/addPermToGroup",
    filePath : "addPermissionToRole.js",
    forcedStart : true,
    enabled : true,
    permissions : [
        "admin"
    ]
};

module.exports.defaults = defaults;
module.exports.classObj = class addPermissionToRole extends BasicCommand{

    constructor(discord, eventData, user, database, params){
        super(discord, eventData, user, database, params); //call parent

    }
 
    execute(){
        
    }
}