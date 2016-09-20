"use strict";

(function () {

    class Player {
        constructor(userId, x, y, color) {
            this.userId = userId;

            this.width = 10;
            this.height = 10;
            this.velocity = 5;

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
        }

        renderBox() {
            this.box.beginFill(this.color);
            this.box.drawRect(this.x, this.y, this.width, this.height);
            this.box.endFill();

            return this.box;
        }

        update() {
            this.box.x = this.x;
            this.box.y = this.y;
        }
    }

    var socket = io();
    var userId = guid();
    console.log("my userId is: " + userId);

    var players = {};

    // Autodetect, create and append the renderer to the body element
    var renderer = PIXI.autoDetectRenderer(
        720,
        400,
        { backgroundColor: 0x000000, antialias: true }
    );
    document.body.appendChild(renderer.view);

    // Create the main stage for your display objects
    var stage = new PIXI.Container();

    let velocity = 5;

    function createSelfPlayer() {
        // Set the width and height of our boxes
        let boxWidth = 10;
        let boxHeight = 10;

        // Create the "player"
        let playerBox = new PIXI.Graphics();
        playerBox.beginFill(0x3498db); // Blue color

        let randomX = Math.floor((Math.random() * 100) + 0);
        let randomY = Math.floor((Math.random() * 100) + 0);
        console.log(randomX + " " + randomY);

        // playerBox.drawRect(randomX, randomY, boxWidth, boxHeight);
        playerBox.drawRect(0, 0, boxWidth, boxHeight);
        playerBox.endFill();
        playerBox.vx = 0;
        playerBox.vy = 0;
        stage.addChild(playerBox);

        return playerBox;
    }
    let playerBox = createSelfPlayer();


    function createOtherPlayer(update) {
        let newPlayer = new Player(update.userId, update.x, update.y, update.color);
        stage.addChild(newPlayer.renderBox());
        return newPlayer;
    }

    let lastPosition = {}; // initialize to empty

    socket.on("player location update", function (update) {
        if (update.userId == userId) {
            // this is us, ignore
            return;
        }

        if (!players[update.userId]) {
            // create the player on the fly
            let newPlayer = createOtherPlayer(update);
            players[newPlayer.userId] = newPlayer;
            return;
        }

        console.log(update);

        players[update.userId].x = update.x;
        players[update.userId].y = update.y;
    })

    function broadcastUpdates() { // over the websocket
        let playerPosition = {
            userId: userId,
            x: playerBox.x,
            y: playerBox.y
        }
        if ((playerPosition.x != null && playerPosition.y != null)
            && (lastPosition.x !== playerPosition.x || lastPosition.y !== playerPosition.y)) {
            console.log(playerBox.x + " " + playerBox.y);

            lastPosition = playerPosition;
            socket.emit("player location update", playerPosition);
        }
    }

    function animate() {
        updatePlayerLocation();

        // update all other players
        for (let key in players) {
            if (!players.hasOwnProperty(key)) {
                //The current property is not a direct property of players
                continue;
            }
            players[key].update();
        }

        renderer.render(stage);

        broadcastUpdates();

        requestAnimationFrame(animate);
    }
    animate();


    function updatePlayerLocation() {
        playerBox.x += playerBox.vx;
        playerBox.y += playerBox.vy;
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

    // keyboard controls
    var left = keyboard(37);
    var up = keyboard(38);
    var right = keyboard(39);
    var down = keyboard(40);

    left.press = function () {
        playerBox.vx = -velocity;
    }
    left.release = function () {
        if (right.isDown) {
            playerBox.vx = velocity;
        } else {
            playerBox.vx = 0;
        }
    }

    up.press = function () {
        playerBox.vy = -velocity;
    }
    up.release = function () {
        if (down.isDown) {
            playerBox.vy = velocity;
        } else {
            playerBox.vy = 0;
        }
    }

    right.press = function () {
        playerBox.vx = velocity;
    }
    right.release = function () {
        if (left.isDown) {
            playerBox.vx = -velocity;
        } else {
            playerBox.vx = 0;
        }
    }

    down.press = function () {
        playerBox.vy = velocity;
    }
    down.release = function () {
        if (up.isDown) {
            playerBox.vy = -velocity;
        } else {
            playerBox.vy = 0;
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
