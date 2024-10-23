const canvas = document.getElementById("canvas");
const frame = canvas.getContext("2d");

// Controls
var keys = {};
var mouse = {
        x: 0,
        y: 0,
        down: 0
};
window.addEventListener("keydown", function(e) {
        keys[e.key] = true;
});
window.addEventListener("keyup", function(e) {
        keys[e.key] = false;
});
window.addEventListener("mousemove", function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
});
window.addEventListener("mousedown", function(e) {
        mouse.down = true;
});
window.addEventListener("mouseup", function(e) {
        mouse.down = false;
});

// Variables
var scores = [0, 0];
var frames = 0;
const debug = false;
var state = "menu";
var fiestaEnabled = true;
var fiestaType = "normal";
const fiestas = [
        "drunkpaddles",
        "randomball",
        "normal",
        "reversaball",
        "good luck lol",
        "invisibleball"
]

// objects
var particles = [];
var ball = null;
var players = [];
var buttons = [];

/*
        ---[ Classes ]---
*/
class Player {
        constructor(x, color, id, controllerType, diff) {
                this.y = 180;
                this.x = x;
                this.color = color;
                this.id = id;
                this.controllerType = controllerType;

                this.speed = 4;

                this.width = 20;
                this.height = 60;
                this.diff = diff;
        }

        tick(onHit) {
                var yVel = 0;
                if (this.controllerType == "human") {
                        // Player Controls
                        if (this.id == 0) { this.movement(keys["w"], keys["s"]); }
                        if (this.id == 1) { this.movement(keys["ArrowUp"], keys["ArrowDown"]); }
                }
                if (this.controllerType == "bot") {
                        if (ball) {
                                var targetY = null;
                                if (this.x == 0) {
                                        if (ball.xV < 0) {
                                                targetY = ball.botPredict(this.diff);
                                        } else {
                                                targetY = 180;
                                        }
                                } else {
                                        if (ball.xV > 0) {
                                                targetY = ball.botPredict(this.diff);
                                        } else {
                                                targetY = 180;
                                        }
                                }
                                
                                this.movement(this.y + this.height/2 > targetY, this.y + this.height/2 < targetY);
                                
                        }
                }


                // Ball Collisions
                if (ball) {
                        if (this.detectCollisions(ball)) {
                                if (ball.x < 320) {
                                        ball.x = this.width + ball.r;
                                } else if (ball.x > 320) {
                                        ball.x = canvas.width - (this.width + ball.r);
                                }
                                const dir = Math.atan2(ball.y - (this.y + this.height / 2), ball.x - (this.x + this.width / 2)) * -1;

                                if (fiestaEnabled && (fiestaType == "randomball" || fiestaType == "good luck lol")) {
                                        ball.speed = (Math.random() * (6 + (rand(0, 2) == 2) * 15)) + 1;
                                } else {
                                        ball.speed += 0.35;
                                }
                                
                                ball.yV = Math.sin(dir) * ball.speed;
                                ball.xV = Math.cos(dir) * ball.speed;

                                ball.splat()
                        }
                }
                
        }

        detectCollisions(col) {
                if (col.x + col.r > this.x && col.x - col.r < this.x + this.width) {
                        if (col.y + col.r > this.y && col.y - col.r < this.y + this.height) {
                                return true;
                        }
                }
                return false;
        }

        movement(up, down) {
                var yVel = 0;
                if (up) { yVel -= this.speed; }
                if (down) { yVel += this.speed; }
                yVel *= ( (fiestaEnabled == true && (fiestaType == "drunkpaddles" || fiestaType == "good luck lol")) ? -1 : 1)

                this.y += yVel;
                if (this.y < 0) { this.y = 0; } // Top
                if (this.y > canvas.height - this.height) { this.y = canvas.height - this.height } // Bottom
        }

        draw() {
                frame.fillStyle = this.color;
                frame.fillRect(this.x, this.y, this.width, this.height);
        }
}

class Ball {
        constructor() {
                this.reset()
                this.r = 8;
                this.speed = 3;
                this.color = "lime"
        }

        tick(dontScore, mult) {
                const accuracy = 10;
                if (fiestaEnabled && (fiestaType == "reversaball" || fiestaType == "good luck lol") && rand(0, 100 - Math.round(this.speed)) == 100 - Math.round(this.speed)) {
                        this.xV *= -1.065;
                        this.yV *= -1.065;
                }
                for (var i = 0; i < accuracy; i++) {
                        this.x += (this.xV / accuracy) * mult;
                        this.y -= (this.yV / accuracy) * mult;
        
                        if (this.y < 0 + this.r) { this.y = 0 + this.r; this.yV *= -1; if (!dontScore){this.splat();} } // Top
                        if (this.y > canvas.height - this.r) { this.y = canvas.height - this.r; this.yV *= -1; if (!dontScore){this.splat();} } // Bottom

                        for (var j = 0; j < players.length; j++) {
                                if (players[j].detectCollisions(this)) {
                                        return;
                                }
                        }
                        if (dontScore) {return;}
                        
                        if (this.x < 0 - this.r) {
                                this.score(1, players[0].color)
                                return;
                                
                        }
                        if (this.x > canvas.width + this.r) {
                                this.score(0, players[1].color)
                                return;
                        }
                }
                
        }

        reset() {
                this.x = 320;
                this.y = 180;
                this.speed = 3;


                
                var d = Math.random() * 2 * Math.PI;
                //prevent the ball from going straight up or down
                while(d < Math.PI / 4 || d > Math.PI * 1.75) {
                      d = Math.random() * 2 * Math.PI;  
                }
                this.xV = Math.cos(d) * this.speed;
                this.yV = Math.sin(d) * this.speed;
        }

        draw() {
                if (fiestaEnabled && (fiestaType == "invisibleball" || fiestaType == "good luck lol") && Math.sin(frames / 20) > 0) { return; }
                frame.fillStyle = this.color;
                frame.beginPath();
                frame.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
                frame.fill();
        }

        splat() {
                for (var i = 0; i < 25; i++) {
                        const angle = Math.random() * Math.PI * 2;

                        particles.push(new Particle(ball.x, ball.y, Math.random() * 12, ball.color, Math.cos(angle), Math.sin(angle)));
                }
        }

        score(id, color) {
                for (var i = 0; i < 100; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        particles.push(new Particle(ball.x, ball.y, Math.random() * 15, color, Math.cos(angle) * 3, Math.sin(angle) * 3));
                }
                scores[id] = scores[id] + 1;
                ball = null;

                if (scores[id] >= 3) {
                        state = "gameover";

                        if (scores[0] > scores[1]) {
                                celebrate(players[0].color);
                        } else {
                                celebrate(players[1].color);
                        }
                        setTimeout(function() {
                                mainMenu();
                        }, 5000)
                        return;
                }
                
                setTimeout(function() {
                        ball = new Ball;
                        fiestaType = fiestas[rand(0, fiestas.length - 1)]
                }, 1500);
        }

        botPredict(diff) {
                const dat = {
                        x: this.x,
                        y: this.y,
                        xV: this.xV,
                        yV: this.yV
                }
                for (var i = 0; i < Math.abs(diff) * 5; i++) {
                        this.tick(true, Math.abs(diff)/diff)
                        if (this.x < 0 + this.r || this.x > 640 - this.r) {
                                if (debug) {
                                        this.draw();
                                }
                                const predictY = this.y
                                this.x = dat.x;
                                this.y = dat.y;
                                this.xV = dat.xV;
                                this.yV = dat.yV;
                                return predictY;
                        }
                }

                if (debug) {
                        this.draw();
                }
                const predictY = this.y
                this.x = dat.x;
                this.y = dat.y;
                this.xV = dat.xV;
                this.yV = dat.yV;
                return predictY;
        }

        
}

class Particle {
        constructor(x, y, r, color, xV, yV) {
                this.x = x;
                this.y = y;
                this.r = r;
                this.color = color;
                this.xV = xV;
                this.yV = yV;
        }

        tick() {
                this.x += this.xV * this.r / 10;
                this.y += this.yV * this.r / 10;
                this.r -= 0.1;
                if (this.r < 0) { particles.splice(particles.indexOf(this), 1); }
        }

        draw() {
                if (this.r <= 0) {return;}
                frame.fillStyle = this.color;
                frame.beginPath();
                frame.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
                frame.fill();
        }
}

class Button {
        constructor(x, y, width, height, text, color, onClick) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.text = text;
                this.color = color;
                this.onClick = onClick;
        }

        draw() {
                // draw a rectangle with an outline 
                frame.strokeStyle = this.color;
                frame.fillStyle = "black";
                frame.lineWidth = 5;
                frame.radius = 5;
                frame.strokeRect(this.x, this.y, this.width, this.height);

                frame.fillStyle = this.color;
                frame.font = "20px Sans-serif";
                frame.textAlign = "center";
                frame.fillText(this.text, this.x + this.width / 2 , this.y + this.height / 2 + 5);
        }

        tick() {
                const relativeMouse = {
                        x: (mouse.x * (canvas.width / canvas.clientWidth)) - (canvas.offsetLeft * 0.5),
                        y: (mouse.y * (canvas.height / canvas.clientHeight)),
                        
                }
                if (relativeMouse.x > this.x && relativeMouse.x < this.x + this.width) {
                        if (relativeMouse.y > this.y && relativeMouse.y < this.y + this.height) {
                                if (mouse.down) {
                                        this.onClick();
                                }
                        }
                }
        }
}

function startGame(playerCount, aiDiff) {
        state = "game";
        players = [];
        players.push(new Player(0, "red", 0, "human", 0))
        if (playerCount > 1) {
                players.push(new Player(canvas.width - 20, "blue", 1, "human", aiDiff));
        } else {
                players.push(new Player(canvas.width - 20, "blue", 1, "bot", aiDiff));
        }
        scores = [0, 0];
        ball = new Ball;
}

function mainMenu() {
        fiestaEnabled = false;
        state = "menu";
        ball = new Ball;
        players = [
                new Player(0, "red", 0, "bot", 10),
                new Player(canvas.width - 20, "blue", 1, "bot", 10)
        ];
        buttons.push(new Button(170, 265, 100,50, "1P", "red", function () {
                buttons = [];

                const ais = [
                        {title: "very easy", color: "cyan", diff: -35},
                        {title: "easy", color: "lime", diff: -15},
                        {title: "normal", color: "yellow", diff: 0},
                        {title: "hard", color: "orangered", diff: 8},
                        {title: "expert", color: "red", diff: 15},
                        {title: "good luck lol", color: "purple", diff: 60}
                ]

                var i = 0;
                ais.forEach(function (difficulty) {
                        i++;
                        buttons.push(new Button(50, 20 + (i * 50), 125, 25, difficulty.title, difficulty.color, function () {
                                buttons = [];
                                startGame(1, difficulty.diff)
                        }));
                })
        }));
        buttons.push(new Button(370, 265, 100 ,50, "2P", "blue", function () {
                buttons = [];
                buttons.push(new Button(50, 265, 200, 25, "local match (normal)", "orange", function() {
                        buttons = [];
                        startGame(2, 0);
                }));
                buttons.push(new Button(50, 305, 200, 25, "local match (fiesta)", "pink", function() {
                        buttons = [];
                        startGame(2, 0);
                        fiestaEnabled = true;
                }));
        }));
}
mainMenu();

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }

// Draw functions
function drawText(text, x, y, dir, color, size) {
        frame.fillStyle = color;
        frame.font = size + "px Arial";

        frame.rotate(dir);
        frame.textAlign = "center";
        frame.fillText(text, x, y);

        frame.rotate(-dir);
}

// Functions related to multiplayer
function multiplayerUUID(count) {
        const chars = "abcdef1234567890";
        var result = "";
        for (var i = 0; i < count; i++) {
                const random = Math.floor(Math.random() * chars.length);
                result += chars.charAt(random);
        }
        return result;
}

function multiplayerHandling(connection) {
        connection.on("data", function (data) {
                console.log(data);
        });
}

function celebrate(color) {
        for (var i = 0; i < 3; i++) {
                setTimeout(function () {
                        const pos = {x: rand(0, 640), y: rand(0, 360)}
                        for (var i = 0; i < 100; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                particles.push(new Particle(pos.x, pos.y, Math.random() * 15, color, Math.cos(angle) * 3, Math.sin(angle) * 3));
                        }
                }, 1000 * (i + 1));
        }
}

setInterval(function() {
        frames++
        frame.clearRect(0, 0, canvas.width, canvas.height);
        frame.fillStyle = "#000000";
        frame.fillRect(0, 0, canvas.width, canvas.height);

        // Draw sprites
        players.forEach(function(player) {
                player.tick();
                player.draw();
        });
        particles.forEach(function(particle) {
                particle.tick();
                particle.draw();
        });
        if (ball) {
                ball.tick(false, 1);
                ball.draw();
        }
        buttons.forEach(function(button) {
                button.tick();
                button.draw();
        });

        //Draw Scores
        const bob = {
                "pos": (Math.sin(frames * (Math.PI / 720)) * 20),
                "rot": ((Math.sin(frames * (Math.PI / 360)) * 20)) / (180 * Math.PI)
        }
        drawText(scores[0], (canvas.width/2) - 100, canvas.height/2 + bob.pos, 0, "#400000", 40);
        drawText(scores[1], (canvas.width/2) + 100, canvas.height/2 - bob.pos, 0, "#100040", 40);

        switch (state) {
                case "lanPlay":
                        drawText("Only devices on the same network can join you.", 165, 20, 0, "white", 15)
                        //drawText("ID: "+peerId, 95, 50, 0, "white", 30)
                break;
                case "menu":
                        drawText("Pong", 320, 180, 0, "white", 70);
                        scores = [0,0];
                break;
                case "gameover":
                        if (scores[0] > scores[1]) {
                                drawText("Red Wins!", 320, 180, 0, "red", 55);
                        } else {
                                drawText("Blue Wins!", 320, 180, 0, "blue", 55);
                        }
                break;
                case "game":
                        if (fiestaEnabled) {
                                drawText(fiestaType, 320, 180, 0, "white", 20);
                        }
        }
}, 1000 / 60);