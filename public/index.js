"use strict";

//this should leave index.js
/**
 * guid generator from stackoverflow
 * http://stackoverflow.com/a/105074/981464
 * @return {String} guid
 */
function guid() {
    function s4() {  // eslint-disable-line 
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

/**
 * Send all updates about player location over the socket
 * @param {Object} socket: A socket.io open socket
 * @param {Player} selfPlayer: The local player at this client
 */
function broadcastUpdates(socket, selfPlayer) { // over the websocket
    let playerPosition = {
        userId: selfPlayer.userId,
        x: selfPlayer.x,
        y: selfPlayer.y
    };
    if ((playerPosition.x !== null && playerPosition.y !== null) &&
        (selfPlayer.lastBroadcastedPosition.x !== playerPosition.x ||
            selfPlayer.lastBroadcastedPosition.y !== playerPosition.y)) {
        console.log(selfPlayer.x + " " + selfPlayer.y);

        selfPlayer.lastBroadcastedPosition = playerPosition;
        socket.emit("player location update", playerPosition);
    }
}


(function () {
    let socket = io({ 'sync disconnect on unload': true });

    var userId = guid();
    var players = {};
    var stageHeight = 400;
    var stageWidth = 720;
    let velocity = 5;

    let gameState = {};

    console.log("my userId is: " + userId);

    // Autodetect, create and append the renderer to the body element
    var renderer = PIXI.autoDetectRenderer(
        stageWidth,
        stageHeight,
        { backgroundColor: 0x000000, antialias: true }
    );
    document.body.appendChild(renderer.view);

    // Create the main stage for your display objects
    var stage = new PIXI.Container();

    let smoothie = new Smoothie({
        engine: PIXI,
        renderer: renderer,
        root: stage,
        fps: 30,
        update: animate.bind(this)
    });
    smoothie.start();

    socket.on("connect", function () {
        socket.emit("player joined", {
            userId: userId
        });
    });

    function createPlayerBox(player) {
        // console.log(player);

        let box = new PIXI.Graphics();
        box.beginFill(player.color);
        box.drawRect(player.x, player.y, 10, 10);
        box.endFill();

        return box;
    }

    // dictionary of all blocks by guid, this way we can keep track of blocks we've seen before rather than clearing them from the screen
    let blocks = {}

    function updatePlayer(player) {
        if (blocks[player.userId]) {
            // update the existing player object
            blocks[player.userId].lastUpdated = Date.now();

            let box = blocks[player.userId].box;
            box.x = player.x;
            box.y = player.y;
        } else {
            // create a new player object 
            let box = createPlayerBox(player);
            blocks[player.userId] = {
                box: box,
                lastUpdated: Date.now()
            }

            stage.addChild(box);
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        for (let playerId in gameState.players) {
            updatePlayer(gameState.players[playerId]);
        }

        renderer.render(stage);
    }
    animate();

    function emitEvent(event) {
        socket.emit("player event update", event);
    }

    socket.on("game state update", (state) => {
        gameState = state;
        console.log("received game state");
        console.log(JSON.stringify(gameState, null, 2));
    });

    // //////////////////
    // keyboard controls
    // //////////////////

    var left = keyboard(37);
    var up = keyboard(38);
    var right = keyboard(39);
    var down = keyboard(40);

    left.press = function () {
        emitEvent({
            userId: userId,
            pressing: {
                left: true
            }
        });

        // if (down.isDown || up.isDown) {
        //     selfPlayer.dx = -velocity * 0.70710678118;
        //     if (down.isDown && up.isDown) {
        //         selfPlayer.dy = 0;
        //     } else if (down.isDown) {
        //         selfPlayer.dy = velocity * 0.70710678118;
        //     } else if (up.isDown) {
        //         selfPlayer.dy = -velocity * 0.70710678118;
        //     }
        // } else {
        //     selfPlayer.dx = -velocity;
        // }
    };

    left.release = function () {
        emitEvent({
            userId: userId,
            pressing: {
                left: false
            }
        });

        // if (right.isDown) {
        //     selfPlayer.dx = velocity;
        // } else {
        //     selfPlayer.dx = 0;
        // }

        // if (down.isDown && up.isDown) {
        //     selfPlayer.dy = 0;
        // } else if (down.isDown) {
        //     selfPlayer.dy = velocity;
        // } else if (up.isDown) {
        //     selfPlayer.dy = -velocity;
        // }
    };

    right.press = function () {
        emitEvent({
            userId: userId,
            pressing: {
                right: true
            }
        });

        // if (down.isDown || up.isDown) {
        //     selfPlayer.dx = velocity * 0.70710678118;
        //     if (down.isDown && up.isDown) {
        //         selfPlayer.dy = 0;
        //     } else if (down.isDown) {
        //         selfPlayer.dy = velocity * 0.70710678118;
        //     } else if (up.isDown) {
        //         selfPlayer.dy = -velocity * 0.70710678118;
        //     }
        // } else {
        //     selfPlayer.dx = velocity;
        // }
    };

    right.release = function () {
        emitEvent({
            userId: userId,
            pressing: {
                right: false
            }
        });

        // if (left.isDown) {
        //     selfPlayer.dx = -velocity;
        // } else {
        //     selfPlayer.dx = 0;
        // }

        // if (down.isDown && up.isDown) {
        //     selfPlayer.dy = 0;
        // } else if (down.isDown) {
        //     selfPlayer.dy = velocity;
        // } else if (up.isDown) {
        //     selfPlayer.dy = -velocity;
        // }
    };

    down.press = function () {
        emitEvent({
            userId: userId,
            pressing: {
                down: true
            }
        });

        // if (left.isDown || right.isDown) {
        //     selfPlayer.dy = velocity * 0.70710678118;
        //     if (left.isDown && right.isDown) {
        //         selfPlayer.dx = 0;
        //     } else if (left.isDown) {
        //         selfPlayer.dx = -velocity * 0.70710678118;
        //     } else if (right.isDown) {
        //         selfPlayer.dx = velocity * 0.70710678118;
        //     }
        // } else {
        //     selfPlayer.dy = velocity;
        // }
    };

    down.release = function () {
        emitEvent({
            userId: userId,
            pressing: {
                down: false
            }
        });

        // if (up.isDown) {
        //     selfPlayer.dy = -velocity;
        // } else {
        //     selfPlayer.dy = 0;
        // }

        // if (left.isDown && right.isDown) {
        //     selfPlayer.dx = 0;
        // } else if (left.isDown) {
        //     selfPlayer.dx = -velocity;
        // } else if (right.isDown) {
        //     selfPlayer.dx = velocity;
        // }
    };

    up.press = function () {
        emitEvent({
            userId: userId,
            pressing: {
                up: true
            }
        });

        // if (left.isDown || right.isDown) {
        //     selfPlayer.dy = -velocity * 0.70710678118;
        //     if (left.isDown && right.isDown) {
        //         selfPlayer.dx = 0;
        //     } else if (left.isDown) {
        //         selfPlayer.dx = -velocity * 0.70710678118;
        //     } else if (right.isDown) {
        //         selfPlayer.dx = velocity * 0.70710678118;
        //     }
        // } else {
        //     selfPlayer.dy = -velocity;
        // }
    };

    up.release = function () {
        emitEvent({
            userId: userId,
            pressing: {
                up: false
            }
        });

        // if (down.isDown) {
        //     selfPlayer.dy = velocity;
        // } else {
        //     selfPlayer.dy = 0;
        // }

        // if (left.isDown && right.isDown) {
        //     selfPlayer.dx = 0;
        // } else if (left.isDown) {
        //     selfPlayer.dx = -velocity;
        // } else if (right.isDown) {
        //     selfPlayer.dx = velocity;
        // }
    };

    function keyboard(keyCode) {
        var key = {};

        key.code = keyCode;
        key.isDown = false;
        key.isUp = true;
        key.press = undefined;
        key.release = undefined;

        // The `downHandler`
        key.downHandler = function (event) {
            if (event.keyCode === key.code) {
                if (key.isUp && key.press) key.press();
                key.isDown = true;
                key.isUp = false;
            }
            event.preventDefault();
        };

        // The `upHandler`
        key.upHandler = function (event) {
            if (event.keyCode === key.code) {
                if (key.isDown && key.release) key.release();
                key.isDown = false;
                key.isUp = true;
            }
            event.preventDefault();
        };

        // Attach event listeners
        window.addEventListener(
            "keydown", key.downHandler.bind(key), false
        );

        window.addEventListener(
            "keyup", key.upHandler.bind(key), false
        );

        return key;
    }
})();
