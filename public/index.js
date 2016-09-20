"use strict";

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

class Player {
    constructor(userId, x, y, color, stage) {
        this.userId = userId;
        this.isSelfPlayer = false;

        this.width = 10;
        this.height = 10;
        this.velocity = 5;

        this.lastBroadcastedPosition = {};

        this.x = x;
        this.y = y;

        this.dx = 0;
        this.dy = 0;

        this.box = new PIXI.Graphics();

        if (color) {
            this.color = color;
        } else {
            this.color = 0x11ff22; // greenish
            // TODO pick random color 
        }

        if (stage) {
            stage.addChild(this.renderBox());
        }
    }

    renderBox() {
        this.box.beginFill(this.color);
        this.box.drawRect(this.x, this.y, this.width, this.height);
        this.box.endFill();

        return this.box;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        this.box.x = this.x;
        this.box.y = this.y;
    }
}

function broadcastUpdates(socket, selfPlayer) { // over the websocket
    let playerPosition = {
        userId: selfPlayer.userId,
        x: selfPlayer.x,
        y: selfPlayer.y
    }
    if ((playerPosition.x != null && playerPosition.y != null)
        && (selfPlayer.lastBroadcastedPosition.x !== playerPosition.x
            || selfPlayer.lastBroadcastedPosition.y !== playerPosition.y)) {
        console.log(selfPlayer.x + " " + selfPlayer.y);

        selfPlayer.lastBroadcastedPosition = playerPosition;
        socket.emit("player location update", playerPosition);
    }
}


(function () {

    var socket = io();

    var userId = guid();
    var players = {};
    var stageHeight = 400;
    var stageWidth = 720;
    let velocity = 5;

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

    function createSelfPlayer(userId) {
        let randomX = Math.floor((Math.random() * stageWidth) + 0);
        let randomY = Math.floor((Math.random() * stageHeight) + 0);

        // let selfPlayer = new Player(userId, randomX, randomY, 0x1122ff);
        let selfPlayer = new Player(userId, 20, 20, 0x3498db, stage);
        selfPlayer.isSelfPlayer = true; // in case we forget

        return selfPlayer;
    }
    let selfPlayer = createSelfPlayer(userId);

    function createOtherPlayer(update) {
        let newPlayer = new Player(update.userId, update.x, update.y, update.color, stage);
        return newPlayer;
    }

    socket.on("player location update", function (update) {
        if (update.userId == selfPlayer.userId) {
            // this is us, ignore
            return;
        }

        if (!players[update.userId]) {
            // create the player on the fly
            let newPlayer = createOtherPlayer(update);
            players[newPlayer.userId] = newPlayer;
        }

        console.log(update);

        players[update.userId].x = update.x;
        players[update.userId].y = update.y;
    })


    function animate() {

        selfPlayer.update();

        // update all other players
        for (let key in players) {
            if (!players.hasOwnProperty(key)) {
                //The current property is not a direct property of players
                continue;
            }
            players[key].update();
        }

        broadcastUpdates(socket, selfPlayer);

        renderer.render(stage);
        requestAnimationFrame(animate);
    }
    animate();


    function emitEvent(event) {
        socket.emit("player event update", event);
    }

    ////////////////////
    // keyboard controls
    ////////////////////

    var left = keyboard(37);
    var up = keyboard(38);
    var right = keyboard(39);
    var down = keyboard(40);

    left.press = function () {
        emitEvent({
            userId: selfPlayer.userId,
            pressing: {
                left: true
            }
        })

        if (down.isDown || up.isDown) {
            selfPlayer.dx = -velocity * 0.70710678118;
            if (down.isDown && up.isDown) {
                selfPlayer.dy = 0;
            } else if (down.isDown) {
                selfPlayer.dy = velocity * 0.70710678118;
            } else if (up.isDown) {
                selfPlayer.dy = -velocity * 0.70710678118;
            }
        } else {
            selfPlayer.dx = -velocity;
        }
    }

    left.release = function () {

        emitEvent({
            userId: selfPlayer.userId,
            pressing: {
                left: false
            }
        })

        if (right.isDown) {
            selfPlayer.dx = velocity;
        } else {
            selfPlayer.dx = 0;
        }

        if (down.isDown && up.isDown) {
            selfPlayer.dy = 0;
        } else if (down.isDown) {
            selfPlayer.dy = velocity;
        } else if (up.isDown) {
            selfPlayer.dy = -velocity;
        }
    }

    right.press = function () {

        emitEvent({
            userId: selfPlayer.userId,
            pressing: {
                right: true
            }
        })

        if (down.isDown || up.isDown) {
            selfPlayer.dx = velocity * 0.70710678118;
            if (down.isDown && up.isDown) {
                selfPlayer.dy = 0;
            } else if (down.isDown) {
                selfPlayer.dy = velocity * 0.70710678118;
            } else if (up.isDown) {
                selfPlayer.dy = -velocity * 0.70710678118;
            }
        } else {
            selfPlayer.dx = velocity;
        }
    }

    right.release = function () {

        emitEvent({
            userId: selfPlayer.userId,
            pressing: {
                right: false
            }
        })

        if (left.isDown) {
            selfPlayer.dx = -velocity;
        } else {
            selfPlayer.dx = 0;
        }

        if (down.isDown && up.isDown) {
            selfPlayer.dy = 0;
        } else if (down.isDown) {
            selfPlayer.dy = velocity;
        } else if (up.isDown) {
            selfPlayer.dy = -velocity;
        }
    }

    down.press = function () {

        emitEvent({
            userId: selfPlayer.userId,
            pressing: {
                down: true
            }
        });

        if (left.isDown || right.isDown) {
            selfPlayer.dy = velocity * 0.70710678118;
            if (left.isDown && right.isDown) {
                selfPlayer.dx = 0;
            } else if (left.isDown) {
                selfPlayer.dx = -velocity * 0.70710678118;
            } else if (right.isDown) {
                selfPlayer.dx = velocity * 0.70710678118;
            }
        } else {
            selfPlayer.dy = velocity;
        }
    }

    down.release = function () {

        emitEvent({
            userId: selfPlayer.userId,
            pressing: {
                down: false
            }
        });

        if (up.isDown) {
            selfPlayer.dy = -velocity;
        } else {
            selfPlayer.dy = 0;
        }

        if (left.isDown && right.isDown) {
            selfPlayer.dx = 0;
        } else if (left.isDown) {
            selfPlayer.dx = -velocity;
        } else if (right.isDown) {
            selfPlayer.dx = velocity;
        }
    }

    up.press = function () {

        emitEvent({
            userId: selfPlayer.userId,
            pressing: {
                up: true
            }
        });

        if (left.isDown || right.isDown) {
            selfPlayer.dy = -velocity * 0.70710678118;
            if (left.isDown && right.isDown) {
                selfPlayer.dx = 0;
            } else if (left.isDown) {
                selfPlayer.dx = -velocity * 0.70710678118;
            } else if (right.isDown) {
                selfPlayer.dx = velocity * 0.70710678118;
            }
        } else {
            selfPlayer.dy = -velocity;
        }
    }

    up.release = function () {

        emitEvent({
            userId: selfPlayer.userId,
            pressing: {
                up: false
            }
        });

        if (down.isDown) {
            selfPlayer.dy = velocity;
        } else {
            selfPlayer.dy = 0;
        }

        if (left.isDown && right.isDown) {
            selfPlayer.dx = 0;
        } else if (left.isDown) {
            selfPlayer.dx = -velocity;
        } else if (right.isDown) {
            selfPlayer.dx = velocity;
        }
    }

    function keyboard(keyCode) {
        var key = {};

        key.code = keyCode;
        key.isDown = false;
        key.isUp = true;
        key.press = undefined;
        key.release = undefined;

        //The `downHandler`
        key.downHandler = function (event) {
            if (event.keyCode === key.code) {
                if (key.isUp && key.press) key.press();
                key.isDown = true;
                key.isUp = false;
            }
            event.preventDefault();
        };

        //The `upHandler`
        key.upHandler = function (event) {
            if (event.keyCode === key.code) {
                if (key.isDown && key.release) key.release();
                key.isDown = false;
                key.isUp = true;
            }
            event.preventDefault();
        };

        //Attach event listeners
        window.addEventListener(
            "keydown", key.downHandler.bind(key), false
        );

        window.addEventListener(
            "keyup", key.upHandler.bind(key), false
        );

        return key;
    }
})();
