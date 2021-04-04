const express = require('express');
const listHelper = require('../discord/listHelper');

module.exports = class API {
   constructor(mainDB, discord){
      this.mainDB = mainDB;
      this.discord = discord;
   }

   //Everything Setup, we now only need to start the bot
   registerEndpoints(){
      const app = express();
      const port = this.mainDB.get('port').value();
      //because for some reason posts don't work with this because the epxressjs devs are braindamaged
      app.use(express.json());

      app.locals.maindDB = this.mainDB;
      app.locals.discord = this.discord;
      app.locals.listHelper = new listHelper(this.discord, this.mainDB);

      app.post('/:uuid/:loginKey/delete', function (req, res){
         const listName = req.body.listName;
         const index = req.body.index;
         let isLogin = app.locals.listHelper.checkLoginForUserId(req.params.uuid, req.params.loginKey);

         if(isLogin){
            app.locals.discord.client.users.fetch(req.params.uuid).then(user => { 
               res.json({
                  login: isLogin,
                  payload: app.locals.listHelper.deleteItemFromListWithIndex(user, listName, index)
               });
            });  
         }
      });
      //Are you logged in
      //domain/:uuid/:loginKey
      app.get('/:uuid/:loginKey', function (req, res) {
         console.log("PARAMS: UUID:" + req.params.uuid + ":LOGINKEY:" + req.params.loginKey);
         let isLogin = app.locals.listHelper.checkLoginForUserId(req.params.uuid, req.params.loginKey);
         res.json({
            login: isLogin
         });
      });

      //Get all List Name
      app.get('/:uuid/:loginKey/lists', function (req, res){
         let isLogin = app.locals.listHelper.checkLoginForUserId(req.params.uuid, req.params.loginKey);
         if(isLogin){
            app.locals.discord.client.users.fetch(req.params.uuid).then(user => { 
               res.json({
                  login: isLogin,
                  payload: app.locals.listHelper.getAllListsForApi(user)
               });
            });  
         }
      });

      //Get all Images from a single list
      app.get('/:uuid/:loginKey/list/:listName', function (req, res){
         let isLogin = app.locals.listHelper.checkLoginForUserId(req.params.uuid, req.params.loginKey);
         if(isLogin){
            app.locals.discord.client.users.fetch(req.params.uuid).then(user => { 
               res.json({
                  login: isLogin,
                  payload: app.locals.listHelper.getSingleListForApi(user, req.params.listName)
               });
            });  
         }
      });
   
      //A KeepAlive Request to refresh the LoginKey
      app.post('/keepAlive', function (req, res){
         let uuid = req.body.uuid;
         let loginKey = req.body.loginkey;
         app.locals.discord.client.users.fetch(uuid).then(user => { 
            let isLogin = app.locals.listHelper.checkLoginForUser(user, loginKey);
            if(isLogin){
               res.json({keepAlive : true});
            }else{
               res.json({keepAlive : false});
            }
         });
      });


      app.listen(port, () => {
         console.log("Successfully Started the API Server");
      })

   }


}