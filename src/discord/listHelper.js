const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
const crypto = require('crypto');
const { Collection } = require('discord.js');

module.exports = class listHelper {
   //Error Types
   static ERROR_NO_DB = 2;
   static ERROR_INVALID_URL = 3;
   static ERROR_NO_IMAGE_WITH_NAME = 4;

   constructor(discordClient, mainDB){
      this.discordClient = discordClient;
      this.mainDB = mainDB;
      this.storagePath = this.getStoragePath();
      this.maxRetry = 50;
      this.loginPath = this.getStorageLoginPath();
   }

   getStoragePath(){
      return this.mainDB.get('listsStoragePath').value();
   }

   getStorageLoginPath(){
      return this.mainDB.get('listsLoginStoragePath').value();
   }

   //Return a still in use Login or create a new one based on random Data
   //These don't have to be cryptographically secure, just random enoughss
   createLoginForUser(user){
      const id = user.id;
      const userLoginPath = this.loginPath + id + ".loginkey";
      if(fs.existsSync(userLoginPath)){
         fs.utimesSync(userLoginPath, new Date(), new Date());
         return fs.readFileSync(userLoginPath, 'ascii').trim(); //We need an encoding else we only get stupid buffers
      }else{
         let loginId = crypto.randomBytes(20).toString('hex');
         fs.writeFileSync(userLoginPath, loginId);
         return loginId;
      }
   }

   //The URL the User will visit to interface with his lists
   loginUrl(loginKey, user){
      let id = user.id; 
      let path = id + "/" + loginKey
      let serverPath = this.mainDB.get('FrontFacingApiServerUrl').value();

      return serverPath + path;
   }

   //Check if the supplied login Key is correct
   checkLoginForUserId(id, login){
      const userLoginPath = this.loginPath + id + ".loginkey";
      if(fs.existsSync(userLoginPath)){
         let content =  fs.readFileSync(userLoginPath, 'ascii').trim();
         if (content == login.trim()){
            fs.utimesSync(userLoginPath, new Date(), new Date()); //KeepAlive
            return true;
         }
      }

      return false;
   }

   //Get All Users which the User shares Servers with and we have access too 
   allMutualUsers(user){
      let allGuilds = this.discordClient.guilds.cache;
      let users = new Collection();
      allGuilds.forEach( guild => {
         let allGuildUsers = guild.members.cache;
         if(allGuildUsers.has(user.id)){
            //Merge them all together and generate a big list
            users = users.concat(allGuildUsers);
         }
      });
      //Delete yourself out of this list
      users.delete(user.id);
      return users;
   }

   //delete a single Image from the list
   deleteItemFromListWithIndex(user, listName, index){
      let list = this.getDatabaseByname(listName, user)
      if(list){
         //get the image array and remove by index
         list.get('images').pullAt(index).write();
      }
      return true;
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
               images : [],
               config : {
                  source : null, 
                  shared : []
               }
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
      let retry = 0;
      for (;count > images.length && retry <= this.maxRetry;) {
         let singleImage = this.getRandomImage(user, dbName);
         if(!singleImage){
            return null;
         }

         //Tell em we have no db
         if(singleImage == listHelper.ERROR_NO_DB){
            return singleImage;
         }

         let existent = images.some(element =>{
            return element.url == singleImage.url
         });

         if (!existent){
            images.push(singleImage);
          }else{
            retry ++;
          }
         
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


   //Get All Lists in a nice Format
   //
   //
   getAllLists(user, filterPublic = false, prettyPrint = false){
      const id = user.id;
      const userStorage = this.storagePath + id;
      if(fs.existsSync(userStorage) == false){
         return null;
      }
      let files = fs.readdirSync(userStorage);
      let entries = Array();
      for(let i = 0; files.length > i; i++){
         let file = files[i];
         let name = file.slice(0,-5); //remove .json
         let db = this.getDatabaseByname(name, user);
         let imageCount = db.get('images').value().length
         let resObj =  {name : name, count : imageCount, isPublic : false};
         let isPublic = db.get('config').get('public').value();


         resObj.isPublic = isPublic;

         if(filterPublic){
            if(isPublic){
               entries.push(resObj);
            }
         }else{
            entries.push(resObj);               
         }
      }

      if(filterPublic && prettyPrint == false){
         return entries;
      }

      if(entries.length == 0){
         return "You don't have any lists yet";
      }

      let string = "__Behold thy lists__ \n";
      entries.forEach(element => {
         if(element.isPublic){
            string += "**" + element.name + " (" + element.count + " images) -PUBLIC- **\n";
         }else{
         string += "**" + element.name + " (" + element.count + " images)**\n";
         }
      });

      return string;
   }


   getAllListsForApi(user){
      const id = user.id;
      const userStorage = this.storagePath + id;
      let files = fs.readdirSync(userStorage);
      let entries = Array();
      for(let i = 0; files.length > i; i++){
         let file = files[i];
         let name = file.slice(0,-5); //remove .json
         let db = this.getDatabaseByname(name, user);
         if(db){
            entries.push(name);    
         }
      }

      return entries;
   }

   getSingleListForApi(user, listName){
      let db = this.getDatabaseByname(listName, user);
      if(db){
         return db.value();
      }
      return null;
   }


   //Get All Lists from every User that has the Public flag set
   //We only can use the ones from users in the current guild tho
   getAllPublicLists(guildId){
      let guild = this.discordClient.guilds.cache.get(guildId);
      let allGuildUsers = guild.members.cache;


      let publicLists = [];

      allGuildUsers.each(member => {
         let user = member.user;
         let allLists = this.getAllLists(user, true);
         if(allLists != null){
            publicLists.push({member : [member], lists : allLists});
         }
      });

      return publicLists;
   }

   //If a Listisalready Public, we can not do that
   isListAlreadyPublic(guildId, listName){
      let userIdAndListArrayArray = this.getAllPublicLists(guildId);
      let isPublic = false;
      userIdAndListArrayArray.forEach(listNameArray => {
         let member = listNameArray.member;
         let lists = listNameArray.lists;
         lists.forEach(listItem => {
            if(listItem.name.toLowerCase() == listName.toLowerCase()){
               isPublic = true;
            }
         })
      });

      return isPublic;
   }


   makeListPublic(listname, userid){
      let db = this.getDatabaseByname(listname, userid);
      if(!db){
         return false;
      }

      if(db.get('config').value() == null){
         db.set('config', {}).write();
      }
      db.get('config').set('public', true).write();
      return true;
   }
   /*
   //PLS DELETE ON End of March 2021 if no Use is found
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
   */
   
}