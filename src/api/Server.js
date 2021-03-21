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

      app.locals.maindDB = this.mainDB;
      app.locals.discord = this.discord;
      app.locals.listHelper = new listHelper(this.discord, this.mainDB);


      app.get('/:uuid/:loginKey', function (req, res) {
         console.log("PARAMS: UUID:" + req.params.uuid + ":LOGINKEY:" + req.params.loginKey);
         app.locals.discord.client.users.fetch(req.params.uuid).then(user => { 
            let isLogin = app.locals.listHelper.checkLoginForUser(user, req.params.loginKey);
            if(isLogin){
               res.json({
                  login: true,
                  payload: app.locals.listHelper.getAllForApi(user)
               });
            }else{
               res.json({
                  login: false
               });
            }
         }).catch( error => {
            console.log(error);
            res.json({});
         });
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