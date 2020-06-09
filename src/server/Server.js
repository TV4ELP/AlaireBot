const Express = require('express');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');;

module.exports = class Server {
   constructor(db){
      this.db = db;
      this.app = Express();
   }

   Start(){
      this.app.get('/', (req, res) => {
         this.DummyResponse(req, res);
      });

      let storagePath = 'storage/';
      let dirs = fs.readdirSync(storagePath);
      for(let i = 0; dirs.length > i; i++){
         let dir = dirs[i];
         if(!isNaN(dir)){
               
               this.app.get("/" + dir, (req, res) => {
                  this.DummyResponse(req, res);
               })
         }
      }

      this.app.listen(3000);
   }

   DummyResponse(req, res){
      res.send('Hello World!');
   }
};