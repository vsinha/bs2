"use strict";

var Express = require("express");
var app = Express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(Express.static('public'));

// let serverPlayers = {};

io.on('connection', function(socket){
  console.log('a user connected');

  // socket.on("player added", function(update) {
  //     io.emit("player added", update);
  // })

  socket.on("player location update", function(update) {
      io.emit("player location update", update);
  });

  socket.on('disconnect', function(update){
    console.log('user disconnected');
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
