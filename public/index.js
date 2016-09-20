    (function () {

    var socket = io();

    // Autodetect, create and append the renderer to the body element
    var renderer = PIXI.autoDetectRenderer(
        720,
        400,
        { backgroundColor: 0x000000, antialias: true }
    );
    document.body.appendChild(renderer.view);

    // Create the main stage for your display objects
    //var stage = new PIXI.Stage(0x66FF99);
    var stage = new PIXI.Container();

    // Set the width and height of our boxes
    var boxWidth = 10;
    var boxHeight = 10;

    // Create the "player"
    var playerBox = new PIXI.Graphics();
    playerBox.beginFill(0x3498db); // Blue color
    playerBox.drawRect(200, 200, boxWidth, boxHeight);
    playerBox.endFill();
    playerBox.vx = 0;
    playerBox.vy = 0;
    stage.addChild(playerBox);

    var velocity = 5;

    // Create the target
    var goalBox = new PIXI.Graphics();
    goalBox.beginFill(0xe74c3c); // Red color
    goalBox.drawRect(0, 0, boxWidth, boxHeight);
    goalBox.endFill();
    stage.addChild(goalBox);

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

    goalBoxSpawn();

    socket.on("player location update", function(update) {
        console.log(update);
        playerBox.x = update.x;
        playerBox.y = update.y;
    })

    let lastPosition = {}; // initialize to empty
    function broadcastUpdates() { // over the websocket
        let playerPosition = {
            x: playerBox.x,
            y: playerBox.y
        }
        if (lastPosition.x !== playerPosition.x || lastPosition.y !== playerPosition.y) {
            lastPosition = playerPosition;
            socket.emit("player location update", playerPosition);
        }
    }

    function animate() {
        updatePlayerLocation();

        //Render the stage
        renderer.render(stage);

        broadcastUpdates();
        
        // Check if your player collides with the target
        checkPosition();

        requestAnimationFrame(animate);
    }
    animate();


    function updatePlayerLocation() {
        playerBox.x += playerBox.vx;
        playerBox.y += playerBox.vy;
    }

    function goalBoxSpawn() {
        // Spawns the target at a random position on our stage

        // Create two random points on our stage
        var randomX = Math.floor((Math.random() * 10) + 0);
        var randomY = Math.floor((Math.random() * 10) + 0);

        // Set the position of our target
        goalBox.position.x = boxWidth * randomX;
        goalBox.position.y = boxHeight * randomY;
    }

    function checkPosition() {
        // If the player and target are at the same position, spawn the target in another position
        if (goalBox.position.x === playerBox.position.x && goalBox.position.y === playerBox.position.y) {
            goalBoxSpawn();
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
 