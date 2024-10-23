var edibles = [];
var moles = [];
var score = [0,0,0,0];

class Mole {
        constructor (x, y, size, color) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.color = color;
        }

        draw () {
                const pos = this.objectRelativePos()
                const size = this.objectSize()

                // Body
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Eyes
                ctx.fillStyle = "black";
                ctx.beginPath(); // Eye1
                ctx.arc(pos.x - (0.5 * size), pos.y, size/5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath(); // Eye2
                ctx.arc(pos.x + (0.5 * size), pos.y, size/5, 0, 2 * Math.PI);
                ctx.fill();

                // Nose
                ctx.fillStyle = "#965744";
                ctx.beginPath(); // Main
                ctx.arc(pos.x, pos.y + (0.35 * size), size/3.5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = "black";
                ctx.beginPath(); // Sub
                ctx.arc(pos.x, pos.y + (0.45 * size), size/7, 0, 2 * Math.PI);
                ctx.fill();

                // Grabby hands
                ctx.fillStyle = "#965744";
                ctx.beginPath(); // Hand1
                ctx.arc(pos.x - (0.95 * size), pos.y + (0.6 * size), size/3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath(); // Hand2
                ctx.arc(pos.x + (0.95 * size), pos.y + (0.6 * size), size/3, 0, 2 * Math.PI);
                ctx.fill();
        }

        objectRelativePos() {
                return {
                        x: ((this.x / canvasSize.width) * canvas.width) + (canvas.width / 2),
                        y: ((this.y / canvasSize.height) * canvas.height) + (canvas.height / 2)
                };
        }

        objectSize() {
                return this.size * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height)
        }
}

class Worm {
        constructor (x, y, size, color) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.color = color;
        }

        draw() {
                const pos = this.objectRelativePos()
                const size = this.objectSize()

                ctx.beginPath();
                ctx.lineWidth = 10;
                ctx.strokeStyle = this.color;
                for (let i = 0; i < this.size; i++) {
                        ctx.lineTo(pos.x + (i*3), pos.y + (Math.sin((i/this.size*2) * Math.PI * 2) * 10))
                }
                ctx.stroke();
        }

        objectRelativePos() {
                return {
                        x: ((this.x / canvasSize.width) * canvas.width) + (canvas.width / 2),
                        y: ((this.y / canvasSize.height) * canvas.height) + (canvas.height / 2)
                };
        }

        objectSize() {
                return this.size * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height)
        }
}

class Player {
        constructor (x,y,color,size,id) {
                this.mole = new Mole(x, y, 10, color);
                this.x = x;
                this.y = y;
                this.color = color;
                this.id = id;
                this.size = size;
                this.stunned = false;

                this.controls = ["a", "l", "f", "j"][id]
        }

        draw() {
                this.mole.x = this.x;
                this.mole.y = this.y;
                this.mole.size = this.size;
                this.mole.color = this.color;
                this.mole.draw()
        }

        tick() {
                const aiClick = (this.isAI && Math.round(rand(0, 10)) == 0 && edibles.length > 0 && edibles[0].constructor !== Circle)
                if ((keys["clicked"][this.controls] || aiClick) && !this.stunned) {
                        // Grab a edible
                        if (edibles.length > 0) {
                                const grabbed = canvasItems[canvasItems.indexOf(edibles[0])];
                                const angle = angleBetween(this, grabbed);
                                var me = this;
                                edibles.splice(0, 1);

                                // Return the edible to the player
                                const loop = setInterval(function () {
                                        grabbed.x -= Math.cos(angle)*9;
                                        grabbed.y -= Math.sin(angle)*9;


                                        const dist = distanceBetween(me, grabbed);
                                        if (dist < 20) {
                                                if (!grabbed.isEdible) {
                                                        for (let player of moles) {
                                                                if (player.id == me.id) {
                                                                        score[moles.indexOf(me)] -= 6;
                                                                        if (!player.stunned) {
                                                                                const originalColor = player.color;
                                                                                player.stunned = true;
                                                                                player.color = "black";

                                                                                setTimeout(function () {
                                                                                        player.color = originalColor;
                                                                                        player.stunned = false;
                                                                                }, 8000);
                                                                        }
                                                                }
                                                        }
                                                }
                                                canvasItems.splice(canvasItems.indexOf(grabbed, 0), 1)
                                                if (moles.indexOf(me) > -1) {
                                                        score[moles.indexOf(me)] += 1;
                                                        if (score[moles.indexOf(me)] >= 100) {
                                                                moles = [];
                                                                canvasItems = [];

                                                                const winText = new Text("Player "+(+me.id+1)+" wins!", 0 ,0, 100, me.color, "center");
                                                                winText.bold = true;
                                                                uiCanvasItems.push(winText);
                                                                score = [0,0,0,0];

                                                                setTimeout(function () {window.location = ""}, 4000);
                                                        }
                                                }
                                                clearInterval(loop)
                                        }
                                }, 1000 / 60);
                                
                        }
                }
        }
}



// Title
const title = new Text("Mole Party", 0, -50, 75, "brown", "center");
title.bold = true;
const happyMoleDay = new Text("Happy Mole Day 2024!", 0, -25, 25, "white", "center");
happyMoleDay.italics = true;
canvasItems.push(happyMoleDay)
canvasItems.push(title)
const mole1 = new Mole(-320, 100, 70, "brown")
canvasItems.push(mole1)
const mole2 = new Mole(320, 100, 70, "brown")
canvasItems.push(mole2)

var playerEditText = new EditBox(0, 100, 400, 35, "black", "center", "How many players are playing?");
playerEditText.accepts = "number";
playerEditText.onenter = function () {
        const tutorialText = new Text("Click on your player button to eat worms. Watch out for the bombs. First one to 100 points wins!", 0, -195, 20, "white", "center");
        setTimeout(function () {
                uiCanvasItems.splice(uiCanvasItems.indexOf(tutorialText), 1);
        }, 15000);
        uiCanvasItems.push(tutorialText);
        const playersPlaying = playerEditText.text;
        canvasItems = [];

        for (let i = 0; i < 4; i++) {
                const playerData = [
                        {pos:{x:-320,y:160},color:"red"},
                        {pos:{x:320,y:160},color:"blue"},
                        {pos:{x:-100,y:160},color:"lime"},
                        {pos:{x:100,y:160},color:"yellow"}
                ]
                const player = new Player(playerData[i]["pos"]["x"], playerData[i]["pos"]["y"], playerData[i]["color"], 40, i);
                player.isAI = (i > playersPlaying-1)
                moles.push(player);
                canvasItems.push(player);

                const scoredisplay = new Text("0", playerData[i]["pos"]["x"], playerData[i]["pos"]["y"]+75, 50, "white", "center");
                scoredisplay.bold = true;
                scoredisplay.id = i;
                scoredisplay.tick = function () {
                        this.text = score[this.id];
                }
                canvasItems.push(scoredisplay);

                if (i < playersPlaying) {
                        const controlsdisplay = new Text("["+player.controls+"]", playerData[i]["pos"]["x"], playerData[i]["pos"]["y"]-70, 25, "white", "center");
                        controlsdisplay.italics = true;
                        canvasItems.push(controlsdisplay)
                }
        }

        setInterval(function () {
                if (Math.round(rand(0, 3))==3) {
                        for (let i = 0; i < Math.round(rand(1, 12)); i++) {
                                const bomb = new Circle(Math.round(rand(-100, 100)), Math.round(rand(-100, 100)), 20, "black");
                                bomb.light = 0;
                                bomb.isEdible = false;
                                bomb.tick = function () {
                                        this.light = this.light==0?255:0
                                        this.color = rgbToHex(Math.round(this.light), Math.round(this.light/3.5), 0);
                                }
                                edibles.push(bomb);
                                canvasItems.push(bomb);

                                setTimeout(function () {
                                        if (edibles.indexOf(bomb) > -1) {
                                                edibles.splice(edibles.indexOf(bomb), 1);
                                                canvasItems.splice(canvasItems.indexOf(bomb), 1);
                                        }
                                }, 3000)
                        }
                } else {
                        const isBigCluster = Math.round(rand(0, 2)) == 0;
                        for (let i = 0; i < Math.round(rand(8, 16)) * ((Math.round(rand(5, 10)) * isBigCluster?1:0)+1); i++) {
                                const edible = new Worm(Math.round(rand(-100, 100)), Math.round(rand(-100, 100)), 25, randomColor());
                                edible.isEdible = true;
                                edibles.push(edible);
                                canvasItems.push(edible);
                        }
                }
        }, 5000)
}
canvasItems.push(playerEditText);