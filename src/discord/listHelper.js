const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
module.exports = class listHelper {
   //Error Types
   static ERROR_NO_DB = 2;
   static ERROR_INVALID_URL = 3;
   static ERROR_NO_IMAGE_WITH_NAME = 4;

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
      name = name.toLowerCase();
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

   //
   //Get a Database by Name. If no name is specified it will be "default"
   //Return THE DB
   getDatabaseByname(name, user){
      if(!name || name == ""){
         name = "default";
      }
      return this.internalGetDatabase(name, user, false);
   }

   //
   //Create a new Databse with a name
   //Return the DB || False if it already exists
   createDatabaseByname(name, user){
      if(!name || name == ""){
         name = "default";
      }
      let database =  this.internalGetDatabase(name, user, true);
      if(database){
         database.defaults(
            {
               images : []
            }
         ).write();
      }
      return database;
   }


   //
   //Add a new ImageSet to the Database
   //Returns false if we didn't find a db with the name
   addImageToDatabase(user, dbName, url, ImageName){
      let db = this.getDatabaseByname(dbName, user);
      if(!db){
         db = this.createDatabaseByname(dbName, user);
      }
      //Check if it is a valid url
      try {
         new URL(url);
      } catch (_) {
         return listHelper.ERROR_INVALID_URL;
      }

      let imageObj = {
         name : ImageName,
         url : url,
         timeStamp : Date.now()
      };

      db.get('images').push(imageObj).write();
      return true;
   }

   //
   //Get A Random Image
   //
   getRandomImage(user, dbName){
      let db = this.getDatabaseByname(dbName, user);
      if(!db){
         return listHelper.ERROR_NO_DB;
      }
      let images = db.get('images').value();
      let singleObj = images[Math.floor(Math.random() * images.length)];
      return singleObj;
   }

   getRandomImageCount(user, dbName, count){
      let images = Array();
      for (let i = 0; i < count; i++) {
         images.push(this.getRandomImage(user, dbName));   
      }

      return images;
   }

   //Do a lazy search
   //Try to get an Image which is close to the name
   //
   getImageByName(user, dbName, imageName){
      let db = this.getDatabaseByname(dbName, user);
      if(!db){
         return listHelper.ERROR_NO_DB;
      }
      let images = db.get('images').value();
      let match = listHelper.ERROR_NO_IMAGE_WITH_NAME;
      images.some(element => {
         if(element.name == null){
            return false;
         }

         if(element.name.includes(imageName)){
            match = element;
            return true;
         }
      });

      return match;
   }


   //
   //
   //
   gatAllLists(user){
      const id = user.id;
      const userStorage = this.storagePath + id;
      let files = fs.readdirSync(userStorage);
      let entries = Array();
      for(let i = 0; files.length > i; i++){
         let file = files[i];
         let name = file.slice(0,-5); //remove .json
         let imageCount = this.getDatabaseByname(name, user).get('images').value().length;
         let resObj =  {name : name, count : imageCount};
         entries.push(resObj);               
      }

      let string = "Here are your lists \n";
      if(entries.length == 0){
         string = "You don't have any lists yet";
      }

      entries.forEach(element => {
         string += element.name + " :Image Count:" + element.count + "\n";
      });

      return string;
   }

   getAllImages(user, dbName){
      let db = this.getDatabaseByname(dbName, user);
      if(!db){
         return listHelper.ERROR_NO_DB;
      }

      let images = db.get('images').value();
      let BigString = "Your images are:\n";
      if(images.length == 0){
         BigString = "You don't have any images in this list"
      }

      images.forEach(element => {
         let date = new Date(element.timeStamp);
         let name = "";
         if(element.name != null){
            name = element.name;
         }
         BigString += "Name " + name + "\nURL <" + element.url + ">\nDATE " + date.toLocaleString("de-DE");
         BigString += "\n-------------------\n";
      });

      return BigString;
   }
   
}