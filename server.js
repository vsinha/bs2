"use strict";

var Express = require("express");
var Http = require("http");
var Socketio = require("socket.io");

var app = new Express();
var server = new Http.Server(app);
var io = new Socketio(server);

app.use(Express.static('public'));

// let serverPlayers = {};

io.on('connection', socket => {
  console.log('a user connected');

  // socket.on("player added", function(update) {
  //     io.emit("player added", update);
  // })

  socket.on("player location update", update => {
    io.emit("player location update", update);
  });

  socket.on("player event update", event => {
    console.log(event);
  });

  socket.on('disconnect', update => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
