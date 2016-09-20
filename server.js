"use strict";

var Express = require("express");
var app = Express();
app.use(Express.static('public'));



var http = require('http').Server(app);
var io = require('socket.io')(http);
var math = require('mathjs');

//ticks
var NanoTimer = require('nanotimer');
var timer = new NanoTimer();
var tick = 0;
var maxDistancePerTick = 5;
timer.setInterval(incrementTick, '', '100m'); //10 ticks per second 

function incrementTick(){
    tick++;
    console.log(tick);
}





function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}


io.on('connection', function(socket){
  console.log('a user connected');


  socket.on("new user request", function(update) {
    console.log(update);

    //add userId
    gameboard.push({
      key: "userId",
      value: guid()
      });

    //calculate and add game x,y posistion ensuring that it does not overlap with another player

    //send game board update out to everyone
    //io.emit("game board update", gameBoard);


  });




  socket.on("player location update", function(update) {
    console.log(update);
    //check that actions are legal then modify game board 

    // if ((math.abs(update['userId']['x'] - gameBoard['userId']['x'])/(tick - gameBoard['userId']['recentTick']) <= maxDistancePerTick)  &&     
    //     (math.abs(update['userId']['y'] - gameBoard['userId']['y'])/(tick - gameBoard['userId']['recentTick']) <= maxDistancePerTick)){
    //   gameBoard['userId']['x'] = update['userId']['x'];
    //   gameBoard['userId']['y'] = update['userId']['y'];    
    // }

    //emit game board

    //io.emit("game board update", gameBoard);

      io.emit("player location update", update);
  });

  socket.on('disconnect', function(update){
    console.log('user disconnected');
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});








//temp 
var jsonfile = require('jsonfile')
var file = 'public/playerUpdates.json'
var gameBoard;
jsonfile.readFile(file, function(err, obj) {
  gameBoard = obj;
})
