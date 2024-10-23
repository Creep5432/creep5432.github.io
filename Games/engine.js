const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var canvasItems = [];
var uiCanvasItems = [];
var keys = {held: {}, clicked: {}};
const resolution = 480
const canvasSize = {
        width: Math.round(resolution * (16 / 9)),
        height: resolution
};
var runtime = {
        start: function () {
                
        },
        tick: function () {
                
        }
}

//run start function once all resources are loaded
window.onload = function () {
        if (runtime.start) {
                if (runtime.start.constructor == Function) {
                        runtime.start()
                }
        }
}

// Mouse shit ig
const mouse = {
        x: 0,
        y: 0,
        down: false,
        clicked: false
}

canvas.onmouseup = function(e) { mouse.down = false;mouse.clicked = false; }
canvas.onmousedown = function(e) { mouse.down = true; mouse.clicked = true; }
window.onmousemove = function(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvasSize.width / canvas.width);
        const mouseY = (e.clientY - rect.top) * (canvasSize.height / canvas.height);
        
        mouse.x = mouseX - (canvasSize.width / 2);
        mouse.y = mouseY - (canvasSize.height / 2);
}
window.onkeydown = function(e) { keys["held"][e.key] = true; keys["clicked"][e.key]  = true; }
window.onkeyup = function(e) { keys["held"][e.key]  = false; }

canvas.onclick = function(e) {mouse.clicked = true;setTimeout(function(){mouse.clicked = false;})}

class Text {
        constructor(text, x, y, size, color, align) {
                this.text = text;
                this.x = x;
                this.y = y;
                this.size = size;
                this.color = color;
                this.align = align;
        }

        draw() {
                const font = {
                        italics: (this.italics==true?"italic":"normal"),
                        bold: (this.bold==true?" bold":" normal"),
                }
                ctx.font = `${font["italics"]} normal${font["bold"]} ${this.objectSize()}px Arial`;
                ctx.fillStyle = this.color;
                ctx.textAlign = this.align;

                const pos = this.objectRelativePos()

                ctx.fillText(this.text, pos.x, pos.y);
        }

        objectSize() {
                return this.size * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height)
        }

        objectRelativePos() {
                return {
                        x: ((this.x / canvasSize.width) * canvas.width) + (canvas.width / 2),
                        y: ((this.y / canvasSize.height) * canvas.height) + (canvas.height / 2)
                };
        }
}

class Smile {
        constructor(x, y, size, color) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.color = color;
        }

        draw() {
                const pos = this.objectRelativePos()
                // Main circle
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, this.objectSize(), 0, 2 * Math.PI);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Smile
                ctx.beginPath();
                ctx.arc(pos.x, pos.y + (0.1 * this.objectSize()), this.objectSize() / 1.5, 0, Math.PI);
                ctx.fillStyle = "black";
                ctx.fill();

                // Eye 1
                ctx.beginPath();
                ctx.arc(pos.x + (0.4 * this.objectSize()), pos.y - (0.35 * this.objectSize()), this.objectSize() / 4, 0, 2 * Math.PI);
                ctx.fillStyle = "black";
                ctx.fill();

                // Eye 2
                ctx.beginPath();
                ctx.arc(pos.x - (0.4 * this.objectSize()), pos.y - (0.35 * this.objectSize()), this.objectSize() / 4, 0, 2 * Math.PI);
                ctx.fillStyle = "black";
                ctx.fill();
        }

        objectSize() {
                return this.size * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height)
        }

        objectRelativePos() {
                return {
                        x: ((this.x / canvasSize.width) * canvas.width) + (canvas.width / 2),
                        y: ((this.y / canvasSize.height) * canvas.height) + (canvas.height / 2)
                };
        }
}

class Circle {
        constructor (x, y, size, color) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.color = color;
        }

        draw() {
                ctx.beginPath();
                ctx.arc(this.objectRelativePos().x, this.objectRelativePos().y, this.objectSize(), 0, 2 * Math.PI)
                ctx.fillStyle = this.color;
                ctx.fill();
        }

        objectSize() {
                return this.size * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height)
        }

        objectRelativePos() {
                return {
                        x: ((this.x / canvasSize.width) * canvas.width) + (canvas.width / 2),
                        y: ((this.y / canvasSize.height) * canvas.height) + (canvas.height / 2)
                };
        }
}

class Rect {
        constructor (x, y, width, height, color) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.color = color;
        }

        draw() {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.objectRelativePos().x - this.objectSize().width / 2, this.objectRelativePos().y - this.objectSize().height / 2, this.objectSize().width, this.objectSize().height);
        }

        objectSize() {
                return {
                        width: this.width * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height),
                        height: this.height * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height)
                }
        }

        objectRelativePos() {
                return {
                        x: ((this.x / canvasSize.width) * canvas.width) + (canvas.width / 2),
                        y: ((this.y / canvasSize.height) * canvas.height) + (canvas.height / 2)
                };
        }
}

class EditBox {
        constructor (x, y, width, height, color, align, hint) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.color = color;
                this.text = "";
                this.align = align;
                this.hint = hint;
                this.hasFocus = false;
        }

        draw() {
                const rect = new Rect(this.x, this.y, this.width, this.height, this.color);
                var text = new Text(this.text, this.x, this.y, 18, "white", this.align);
                if (this.text.length == 0) {
                        text.color = this.hasFocus?"darkgray":"gray";
                        text.italics = true;
                        text.text = this.hint;
                }
                rect.draw();
                text.draw();
        }

        tick() {
                if (!this.hasFocus) {return;}
                for (let key in keys["clicked"]) {
                        if (keys["clicked"][key]) {
                                console.log(key)
                                if (key.length == 1) {
                                        if (!this.accepts || this.accepts == "text") {
                                                this.text += key;
                                        } else if (this.accepts == "number") {
                                                if (["1","2","3","4","5","6","7","8","9","0","-"].includes(key)) {
                                                        this.text += key;
                                                }
                                        }
                                } else {
                                        if (key == "Backspace") {
                                                this.text = this.text.slice(0, -1);
                                        } else if (key == "Enter") {
                                                this.hasFocus = false;
                                                if ("onenter" in this) {
                                                        this.onenter();
                                                }
                                        }
                                }
                        }
                }
        }

        onclick() { this.hasFocus = !this.hasFocus; console.log(this.hasFocus) }

        objectSize() {
                return {
                        width: this.width * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height),
                        height: this.height * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height)
                }
        }

        objectRelativePos() {
                return {
                        x: ((this.x / canvasSize.width) * canvas.width) + (canvas.width / 2),
                        y: ((this.y / canvasSize.height) * canvas.height) + (canvas.height / 2)
                };
        }
}

// Misc
function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function rand(min, max) {
        return Math.random() * (max - min) + min;
}
function rectCollision(rect1, rect2, centered) {
        if (rect1.x + (rect1.width / 2) > rect2.x && rect1.x - (rect1.width / 2) < rect2.x + rect2.width) {
                if (rect1.y + (rect1.height / 2) > rect2.y && rect1.y - (rect1.height / 2) < rect2.y + rect2.height) {
                        return true;
                }
        }
        return false;
}
function randomColor() {
        return rgbToHex(Math.round(rand(0, 255)), Math.round(rand(0, 255)), Math.round(rand(0, 255)))
}
function distanceBetween(object1, object2) {
        return Math.sqrt(Math.pow(object1.x - object2.x, 2) + Math.pow(object1.y - object2.y, 2));
}
function angleBetween(object1, object2) {
        return Math.atan2((object2.y) - (object1.y), object2.x - object1.x);
}



window.onresize = function () {resizeCanvas() }
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();

function canvasItemHandling(item) {
        if (item) {
                if ("tick" in item) {
                        item.tick();
                }
                if ("onclick" in item) {
                        if (mouse.clicked) {
                                //const itemPos = item.objectRelativePos();
                                var itemRect = null;
                                if ("size" in item) {
                                        itemRect = {
                                                x: item.x,
                                                y: item.y,
                                                width: item.size * 2,
                                                height: item.size * 2
                                        }
                                } else if ("width" in item && "height" in item) {
                                        itemRect = {
                                                x: item.x,
                                                y: item.y,
                                                width: item.width,
                                                height: item.height
                                        }
                                }
                                const mouseRect = {
                                        x: mouse.x,
                                        y: mouse.y,
                                        width: 1,
                                        height: 1
                                }
                                if (rectCollision(itemRect, mouseRect)) {
                                        item.onclick();
                                }
                        }
                }
                if ("draw" in item) {
                        item.draw();
                }
        } else {
                canvasItems.splice(canvasItems.indexOf(item), 1);
        }
}

setInterval(function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let item of canvasItems) { canvasItemHandling(item); }
        for (let item of uiCanvasItems) { canvasItemHandling(item); }

        if (runtime.tick) {
                if (runtime.tick.constructor == Function) {
                        runtime.tick();
                }
        }



        mouse.clicked = false;
        for (let key in keys.clicked) {
                if (keys.clicked[key]) {
                        keys.clicked[key] = false;
                }
        }
}, 1000 / 60);