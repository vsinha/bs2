"use strict";

let Express = require("express");
let app = Express();

let http = require('http').Server(app);
let io = require('socket.io')(http);

app.use(Express.static('public'));

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
