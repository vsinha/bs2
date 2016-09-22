"use strict";

let _ = require('lodash');
let Express = require("express");
let Http = require("http");
let math = require('mathjs');
let Socketio = require("socket.io");

let guid = require("./guid");

let app = new Express();
let server = new Http.Server(app);
let io = new Socketio(server);

app.use(Express.static('public'));

server.listen(3000, function () {
    console.log('listening on *:3000');
});

let gameState = {
    players: {}
};

function createNewPlayerObject() {
    return {
        userId: "",
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        color: (0x1333333 + (Math.random()) * 0xcccccc), // janky generate random color
        //color: 0x1166dd,
        pressing: {
            left: false,
            up: false,
            down: false,
            right: false
        }
    };
}

const maxVelocity = 10;
const minVelocityThreshold = 1;
const acceleration = 2;

function handlePlayer(player) {
    // console.log(player)
    console.log("Left/Right")
    if (Math.abs(player.dx) > maxVelocity){ //slow down
        player.dx = (player.dx / Math.abs(player.dx)) * (Math.abs(player.dx) - acceleration);
        console.log(" 1 ")
    } else if (player.pressing.left) { //speed up
        player.dx += -acceleration;
        console.log(" 2 ") 
    } else if (player.pressing.right) { //speed up
        player.dx += acceleration;
        console.log(" 3 ")
    } else if (Math.abs(player.dx) < minVelocityThreshold) { //stop
        player.dx = 0;
        console.log(" 4 ")
    } else { //slow down
        player.dx = (player.dx / Math.abs(player.dx)) * (Math.abs(player.dx) - acceleration);
        console.log(" 5 ")
    }


    console.log("Up/Down")
    if (Math.abs(player.dy) > maxVelocity){ //slow down
        player.dy = (player.dy / Math.abs(player.dy)) * (Math.abs(player.dy) - acceleration);
        console.log(" 1 ")
    } else if (player.pressing.up) { //speed up
        player.dy += -acceleration;
        console.log(" 2 ") 
    } else if (player.pressing.down) { //speed up
        player.dy += acceleration;
        console.log(" 3 ")
    } else if (Math.abs(player.dy) < minVelocityThreshold) { //stop
        player.dy = 0;
        console.log(" 4 ")
    } else { //slow down
        player.dy = (player.dy / Math.abs(player.dy)) * (Math.abs(player.dy) - acceleration);
        console.log(" 5 ")
    }

    //current position + velocity
    player.x += player.dx;
    player.y += player.dy;

    // store the updated player back to the game state object
    gameState.players[player.userId] = player;

    console.log(player);
}

function update(delta) {
    // for player in players, handlePLayer
    for (let playerId in gameState.players) {
        handlePlayer(gameState.players[playerId]);
    }

    // roll dice to determine whether to start spawning a new block

    // collision detection

    // broadcast game state
    io.sockets.emit("game state update", gameState);
}

// start main game loop
/**
Length of a tick in milliseconds. The denominator is your desired framerate.
e.g. 1000 / 20 = 20 fps,  1000 / 60 = 60 fps
*/
const tickLengthMs = 1000 / 20

/* gameLoop related variables */
// timestamp of each loop
let previousTick = Date.now() // initialize
// number of times gameLoop gets called
let actualTicks = 0

let gameLoop = function () {
    let now = Date.now()

    actualTicks++
    if (previousTick + tickLengthMs <= now) {
        let delta = (now - previousTick) / 1000
        previousTick = now

        update(delta);

        //console.log('delta', delta, '(target: ' + tickLengthMs + ' ms)', 'node ticks', actualTicks)
        actualTicks = 0
    }

    if (Date.now() - previousTick < tickLengthMs - 16) {
        setTimeout(gameLoop)
    } else {
        setImmediate(gameLoop)
    }
}

gameLoop();

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on("player joined", function (update) {
        console.log("newPlayer: " + JSON.stringify(update));

        // create a new player & save to game state
        // TODO base the guid off the users's socket  for security purposes

        let newPlayer = createNewPlayerObject();
        newPlayer.socketId = socket.id;
        newPlayer.userId = update.userId;
        gameState.players[newPlayer.userId] = newPlayer;
    });

    socket.on("player event update", function (event) {
        let patchedPlayer = gameState.players[event.userId];
        for (let key in event) {
            if (key === "pressing") {
                for (let button in event["pressing"]) {
                    patchedPlayer.pressing[button] = event["pressing"][button];
                }
            }
            // for now, only handle 'pressing' events 
            // else {
            //     console.log(key);
            //     patchedPlayer[key] = event[key];
            // }
        }
    });

    socket.on('disconnect', function (update) {
        console.log('user disconnected');

        // delete players from gamedata on disconnect
        let player = _.find(gameState.players, { 'socketId': socket.id });
        delete gameState.players[player.userId];
    });
});

//temp 
let jsonfile = require('jsonfile')
let file = 'public/playerUpdates.json'
let gameBoard;
jsonfile.readFile(file, function (err, obj) {
    gameBoard = obj;
})
