const Express = require('express');

module.exports = class Server {
    constructor(db){
        this.db = db;
        this.app = Express();
     }

     Start(){
        this.app.get('/', (req, res) => {
            this.DummyResponse(req, res);
        });

        this.app.listen(3000);
     }

     DummyResponse(req, res){
        res.send('Hello World!');
     }
};