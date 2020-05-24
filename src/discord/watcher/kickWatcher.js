const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');

module.exports = class kickWatcher {
    constructor(discord){
        this.interval = 10 * 1000; //10 seconds
        this.client = discord;
    }
 
    watch(){
        let databases = this.watchAllDatabses();
    }

    watchAllDatabses(){
        let storagePath = 'storage/';
        let dirs = fs.readdirSync(storagePath);
        for(let i = 0; dirs.length > i; i++){
            let dir = dirs[i];
            if(!isNaN(dir)){
                
                setInterval(this.watchInternal.bind(null, dir, storagePath, this.client), this.interval); //null because i dunno anymore
            }
        }
    }

    watchInternal(db, storagePath, client){
        let tempDB = low(new FileSync(storagePath + db + '/' + 'muted.json'))
        let mutedDb = tempDB.get('currentlyMuted');
        let currentlyMuted = mutedDb.value();
        for(let i = 0; currentlyMuted.length > i; i++){
            let userObj = currentlyMuted[i];
            let now = Date.now();
            let finished = userObj.duration + userObj.timestamp;
            if(now > finished){
                mutedDb.remove({id : userObj.id}).write();
                let guilds = client.guilds.cache;
                let guild = guilds.get(db);
                let members = guild.members.cache;
                let member = members.get(userObj.id);
                let roleManager = member.roles;
                let configDB = low(new FileSync(storagePath + db + '/' + 'config.json'));
                let muteRoleId = configDB.get('muterole').value();
                roleManager.remove(muteRoleId).then(guildmember => {
                    
                });
            }
        }
    }

}