const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
module.exports = class listHelper {

   constructor(discordClient, mainDB){
      this.discordClient = discordClient;
      this.mainDB = mainDB;
      this.storagePath = this.getStoragePath();
   }

   getStoragePath(){
      return this.mainDB.get('listsStoragePath').value();
   }

   //Create New or Return existing List Folder plus Database for UserID
   //Input String Name / User ID / Weather you want to create or not
   //
   internalGetDatabase(name , user, create = true){
      const id = user.id;
      const userStorage = this.storagePath + id;
      const userListPath = userStorage + "/" + name + ".json";
      //It exists and we don't just wanna grab it? Then we are done
      if(fs.existsSync(userListPath) && create == true){
         return false;
      }

      //If we don't want to create a Database, and we don't have it. We are done
      if(create == false && fs.existsSync(userListPath) == false){
         return false;
      }

      if(!fs.existsSync(userStorage)){
         fs.mkdirSync(userStorage);
      }

      let listDatabase = low(new FileSync(userListPath));

      return listDatabase;
   }

   getDatabaseByname(name, user){
      return this.internalGetDatabase(name, user, false);
   }

   createDatabaseByname(name, user){
      let database =  this.internalGetDatabase(name, user, true);
      if(database){
         database.defaults({images : []}).write();
      }
      return database;
   }
   
}