const fs = require('fs');
const kickWatcher = require('./kickWatcher');

module.exports = class loginWatcher extends kickWatcher{
   constructor(discord){
      super(discord);
      this.interval = 10 * 1000; //10 seconds
      this.storagePath = 'storage/oneTimeLogin/';
      this.timeToLive = 15 * 1000 * 60 // 15 minutes long valid logins 
   }

   watchAllDatabses(){
         setInterval(this.watchInternal.bind(null, null, this.storagePath, this.timeToLive), this.interval); //null because i dunno anymore
   }

   watchInternal(fileName, storagePath, timetoLive){
      let dirs = fs.readdirSync(storagePath);
      for(let i = 0; dirs.length > i; i++){
         let dir = dirs[i]; 
         let time = fs.statSync(storagePath + dir).mtime;
         let now = new Date();
         let diff = now - time;
         if(diff > timetoLive){
            fs.rmSync(storagePath + dir);
            console.log("Removed LoginKey:" + storagePath + dir);
         }
      }
   }

}