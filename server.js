"use strict";

let Express = require("express");
let app = Express();

let http = require('http').Server(app);
let io = require('socket.io')(http);

app.use(Express.static('public'));

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on("player location update", function(update) {
      io.emit("player location update", update);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
