const express = require('express');
const low = require('lowdb');
//We wan't to write and read synchronously to keep things simple
const FileSync = require('lowdb/adapters/FileSync');


module.exports = class API {
   constructor(mainDB, discord){
      this.mainDB = this.mainDB;
      this.discord = this.discord;
   }

   //Everything Setup, we now only need to start the bot
   registerEndpoints(){
      console.log("Successfully Started the API Server");
   }

/*
   app.get('/:uuid/:loginKey', function(req, res) {
      var data = {
          "fruit": {
              "apple": req.params.uuid,
              "color": req.params.uuid
          }
      }; 
  
      send.json(data);
   });
*/
}