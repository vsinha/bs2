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

let jsondiffpatch = require('jsondiffpatch').create();

app.use(Express.static('public'));

let gameState = {
    players: {}
};

const maxVelocity = 10;
const minVelocityThreshold = 1;

function handlePlayer(player) {
    // console.log(player)
    if (player.pressing.left) {
        player.dx = -maxVelocity;
    } else if (player.pressing.right) {
        player.dx = maxVelocity;
    } else {
        if (Math.abs(player.dx) < minVelocityThreshold) {
            player.dx = 0;
        }
        player.dx = player.dx / 2;
    }

    if (player.pressing.up) {
        player.dy = -maxVelocity;
    } else if (player.pressing.down) {
        player.dy = maxVelocity;
    } else {
        if (Math.abs(player.dy) < minVelocityThreshold) {
            player.dy = 0;
        }
        player.dy = player.dy / 2;
    }

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
let tickLengthMs = 1000 / 20

/* gameLoop related variables */
// timestamp of each loop
let previousTick = Date.now()
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


function createNewPlayerObject() {
    return {
        userId: "",
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        color: (0x1000000+(Math.random())*0xffffff), // janky generate random color
        //color: 0x1166dd,
        pressing: {
            left: false,
            up: false,
            down: false,
            right: false
        }
    };
}

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
        let player = _.find(gameState.players, { 'socketId': socket.id });
        console.log(player);
        delete gameState.players[player.userId];
    });
});

server.listen(3000, function () {
    console.log('listening on *:3000');
});








//temp 
let jsonfile = require('jsonfile')
let file = 'public/playerUpdates.json'
let gameBoard;
jsonfile.readFile(file, function (err, obj) {
    gameBoard = obj;
})
