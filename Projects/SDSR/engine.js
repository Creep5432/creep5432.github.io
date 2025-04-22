const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var canvasItems = [];
var uiCanvasItems = [];
var imageCache = {};
var keys = {held: {}, clicked: {}};
var lastKey = null;

const resolution = 480
const canvasSize = {
	width: Math.round(resolution * (16 / 9)),
	height: resolution
};
var dontCacheImages = true;

var runtime = {
	start: function () {

	},
	tick: function () {

	},
	afterDraw: function () {

	},
	beforeTick: function () {

	}
}

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
var touches = []

canvas.onmouseup = function(e) { mouse.down = false;mouse.clicked = false; }
canvas.onmousedown = function(e) { mouse.down = true;mouse.clicked = true; }
canvas.onmousemove = function(e) {
	const coords = convertClientToCanvasCoords(e.clientX, e.clientY);

	mouse.x = coords.x;
	mouse.y = coords.y;
}
canvas.ontouchstart = function (e) {
	e.preventDefault();
	for (let i = 0; i < e.changedTouches.length; i++) {
		const coords = convertClientToCanvasCoords(e.changedTouches[i].clientX, e.changedTouches[i].clientY);

		const touch = {
			x: coords.x,
			y: coords.y,
			id: e.changedTouches[i].identifier,
			down: true,
			clicked: true,
		}
		touches.push(touch)
	}
}
canvas.ontouchmove = function (e) {
	e.preventDefault();
	for (let i = 0; i < e.changedTouches.length; i++) {
		const coords = convertClientToCanvasCoords(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
		const touch = touches.find(a => a.id === e.changedTouches[i].identifier);

		if (touch) {
			const idx = touches.indexOf(touch,0);
			touches[idx].x = coords.x;
			touches[idx].y = coords.y;
		}
	}
}
canvas.ontouchend = function (e) {
	e.preventDefault();
	Array.from(e.changedTouches).forEach((changedTouch) => {
		const touch = touches.find(a => a.id === changedTouch.identifier);
		if (touch) {
			const idx = touches.indexOf(touch,0);
			touches.splice(idx, 1);
		}
	});
};

window.onkeydown = function(e) { 
	if (lastKey !== e.key) {
		keys["held"][e.key] = true;
		keys["clicked"][e.key] = true;
		lastKey = e.key;
	}
}
window.onkeyup = function(e) {
	keys["held"][e.key]  = false;
	if (lastKey == e.key) {
		lastKey = null;
	}
}

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

		ctx.fillText(this.text, pos.x, pos.y+(this.size/8));
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

	baseTick() {
		if (!this.hasFocus) {return;}
		for (let key in keys["clicked"]) {
			if (keys["clicked"][key]) {
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

class ImageObject {
	constructor(src, x, y, size, color) {
		this.src = src;
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = color;
		this.loadingImage = false;
		this.processedImageCache = null;
		this.lastColor = null;
	}

	draw() {
		if (this.processedImageCache && this.lastColor !== this.color) {
			ctx.drawImage(
				this.processedImageCache,
				this.objectRelativePos().x - this.objectSize().width / 2,
				this.objectRelativePos().y - this.objectSize().height / 2,
				this.objectSize().width,
				this.objectSize().height
			);
		} else if (this.src in imageCache) {
			this.width = imageCache[this.src].width;
			this.height = imageCache[this.src].height;

			this.processedImageCache = this.applyColorChange(imageCache[this.src]);
			ctx.drawImage(
				this.processedImageCache,
				this.objectRelativePos().x - this.objectSize().width / 2,
				this.objectRelativePos().y - this.objectSize().height / 2,
				this.objectSize().width,
				this.objectSize().height
			);
		} else if (!this.loadingImage) {
			this.loadingImage = true;
			const img = new Image();
			img.onload = () => {
				imageCache[this.src] = img;
				this.loadingImage = false;
				this.draw();
			};
			img.src = this.src;
		}
		this.lastColor = this.color;
	}

	applyColorChange(image) {
		if (!this.color) {return image;}
		const offCanvas = document.createElement('canvas');
		offCanvas.width = image.width;
		offCanvas.height = image.height;

		const offCtx = offCanvas.getContext('2d');
		offCtx.drawImage(image, 0, 0);


		const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
		const data = imageData.data;


		for (let i = 0; i < data.length; i += 4) {
			data[i] *= (this.color.r / 255);
			data[i + 1] *= (this.color.g / 255);
			data[i + 2] *= (this.color.b / 255);
		}

		offCtx.putImageData(imageData, 0, 0);

		return offCanvas;
	}

	objectSize() {
		return {
			width: (imageCache[this.src].width * this.size) * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height),
			height: (imageCache[this.src].height * this.size) * Math.min(canvas.width / canvasSize.width, canvas.height / canvasSize.height)
		};
	}

	objectRelativePos() {
		return {
			x: ((this.x / canvasSize.width) * canvas.width) + (canvas.width / 2),
			y: ((this.y / canvasSize.height) * canvas.height) + (canvas.height / 2)
		};
	}
}

class Button {
	constructor(text, x, y, width, height, color) {
		this.text = text;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.color = color;
		this.bold = false;
		this.textColor = "white"
	}

	draw() {
		const rect = new Rect(this.x, this.y, this.width, this.height, this.color)
		rect.draw();
		const text = new Text(this.text, this.x, this.y, 18, this.textColor, "center");
		text.bold = this.bold
		text.draw();
	}
}

class MobileJoystick {
	constructor (x, y, size) {
		this.x = x;
		this.y = y;

		this.size = size;
		this.baseSize = size;
		this.stickSize = size/2

		this.color = "gray";
		this.stickColor = "white";
		this.resetOnLetGo = true;

		this.input = {
			x: 0,
			y: 0
		}

		this.finger = null;
	}

	draw () {
		const mainCirc = new Circle(this.x, this.y, this.baseSize, this.color)
		mainCirc.draw();
		const stickCirc = new Circle(this.x+(this.input.x*(this.baseSize/1.25)), this.y+(this.input.y*(this.baseSize/1.25)), this.stickSize, this.stickColor)
		stickCirc.draw();
	}

	baseTick() {
		const curFinger = getFingerHoldingObject(this);
		if (this.finger == null) {
			if (this.resetOnLetGo) {
				this.input = { x: 0, y: 0 };
			}
			
			if (curFinger !== null) {
				this.finger = curFinger.id;
			}
		} else {
			const findFinger = touches.find(f => f.id === this.finger);
			if (findFinger) {
				const dist = clamp(distanceBetween(this, findFinger), 0, this.baseSize);
				const ang = angleBetween(this, findFinger);

				this.input.x = clamp((Math.cos(ang) * dist) / this.baseSize, -1, 1);
				this.input.y = clamp((Math.sin(ang) * dist) / this.baseSize, -1, 1);
			} else {
				this.finger = null;
				if (this.resetOnLetGo) {
					this.input = { x: 0, y: 0 };
				}
			}
		}

		const dist = clamp(distanceBetween({x:0,y:0}, this.input), 0, 1);
		const ang = angleBetween({x:0,y:0}, this.input);

		this.input.x = clamp((Math.cos(ang) * dist), -1, 1);
		this.input.y = clamp((Math.sin(ang) * dist), -1, 1);
	}

}

function convertClientToCanvasCoords(clientx, clienty) {
	const rect = canvas.getBoundingClientRect();
	const x = (clientx - rect.left) * (canvasSize.width / canvas.width);
	const y = (clienty - rect.top) * (canvasSize.height / canvas.height);

	return {
		x: x - (canvasSize.width / 2),
		y: y - (canvasSize.height / 2)
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
	if (centered) {
		if (rect1.x + (rect1.width / 2) > rect2.x && rect1.x - (rect1.width / 2) < rect2.x + (rect2.width/2)) {
			if (rect1.y + (rect1.height / 2) > rect2.y && rect1.y - (rect1.height / 2) < rect2.y + rect2.height/2) {
				return true;
			}
		}
	} else {
		if (rect1.x + rect1.width > rect2.x && rect1.x < rect2.x + rect2.width) {
			if (rect1.y + rect1.height > rect2.y && rect1.y < rect2.y + rect2.height) {
				return true;
			}
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

function celebrate(x, y, intensity) {
	for (let i = 0; i < intensity*10; i++) {
		const confediParticle = new Circle(x, y, rand(2, 10), randomColor());
		const speed = rand(0, intensity);
		const ang = rand(-Math.PI, Math.PI);

		confediParticle.xVel = Math.cos(ang) * speed;
		confediParticle.yVel = Math.sin(ang) * speed;

		confediParticle.tick = function () {
			confediParticle.yVel -= 0.334;

			confediParticle.x += confediParticle.xVel
			confediParticle.y -= confediParticle.yVel
		}

		canvasItems.push(confediParticle);
		setTimeout(function() {
			const index = canvasItems.indexOf(confediParticle)
			if (index >= 0) {
				canvasItems.splice(index, 1)
			}
		}, 2000)
	}
}
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

window.onresize = function () {resizeCanvas() }
function resizeCanvas() {
	const html = document.getElementsByTagName("html")[0]
	canvas.width = Math.min(html.clientWidth, html.clientHeight * (16 / 9));
	canvas.height = Math.min(html.clientHeight, html.clientWidth * (9 / 16))
}
resizeCanvas()

function canvasItemHandling(item) {
	if (item) {
		if ("baseTick" in item) {
			item.baseTick();
		}
		if ("tick" in item) {
			item.tick();
		}
		if ("onclick" in item) {
			if ((mouseOverObject(item) && mouse.clicked)||getFingerHoldingObject(item)) {
				item.onclick();
			}
		}
		if ("candrag" in item) {
			if (item.candrag === true) {
				if (mouseOverObject(item) && mouse.clicked) {
					const pos = {x: item.x - mouse.x, y: item.y - mouse.y}
					const loop = setInterval(function() {
						item.x = pos.x + mouse.x;
						item.y = pos.y + mouse.y;

						if (mouse.down == false) {
							clearInterval(loop);
						}
					});
				}
				const finger = getFingerHoldingObject(item)
				if (finger) {

					const pos = {x: item.x - finger.x, y: item.y - finger.y}
					const loop = setInterval(function() {
						const find = touches.find(function (a) {return a.id === finger.id})

						if (!find || find.down == false) {
							clearInterval(loop);
						} else {
							item.x = pos.x + find.x;
							item.y = pos.y + find.y;
						}
					});
				}
			}
		}
		if ("draw" in item) {
			item.draw();
		}
		if ("tickAfterDraw" in item) {
			item.tickAfterDraw();
		}
	} else {
		canvasItems.splice(canvasItems.indexOf(item), 1);
	}
}

function collRectFromObject(item) {
	var itemRect = null;
	if ("width" in item && "height" in item && "size" in item) {
		itemRect = {
			x: item.x,
			y: item.y,
			width: item.width * item.size,
			height: item.height * item.size
		}
	} else if ("size" in item) {
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
	return itemRect;
}

function mouseOverObject(item) {
	const itemRect = collRectFromObject(item);
	const mouseRect = {
		x: mouse.x,
		y: mouse.y,
		width: 1,
		height: 1
	}

	return rectCollision(itemRect, mouseRect, true)	
}

function fingerOverObject(item) {
	const itemRect = collRectFromObject(item);
	for (let i = 0; i < touches.length; i++) {
		const mouseRect = {
			x: touches[i].x,
			y: touches[i].y,
			width: 1,
			height: 1
		}
		if (rectCollision(itemRect, mouseRect, true)) {
			return true
		}
	}
	return false
}

function getFingerHoldingObject(item) {
	const itemRect = collRectFromObject(item);
	for (let i = 0; i < touches.length; i++) {
		var mouseRect = {
			x: touches[i].x,
			y: touches[i].y,
			width: 1,
			height: 1
		}
		if (rectCollision(itemRect, mouseRect, true) && touches[i].clicked) {
			return touches[i];
		}
	}
	return null;
}

function getPixelColor(x, y) {
	const actPos = {
		x: Math.round(x*(canvas.clientWidth/canvasSize.width)+canvas.clientWidth/2),
		y: Math.round(y*(canvas.clientHeight/canvasSize.height)+(canvas.clientHeight/2))
	}
	const img = ctx.getImageData(actPos.x,actPos.y,1,1)
	const data = img.data;

	//alert(JSON.stringify(actPos))

	return {
		r: data[0],
		g: data[1],
		b: data[2],
		a: data[3]
	};
}

setInterval(function () {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (runtime.beforeTick) {
		if (runtime.beforeTick.constructor == Function) {
			runtime.beforeTick();
		}
	}

	for (let item of canvasItems) { canvasItemHandling(item); }
	for (let item of uiCanvasItems) { canvasItemHandling(item); }

	if (runtime.tick) {
		if (runtime.tick.constructor == Function) {
			runtime.tick();
		}
	}
	if (runtime.afterDraw) {
		if (runtime.afterDraw.constructor == Function) {
			runtime.afterDraw();
		}
	}

	mouse.clicked = false;
	for (let i = 0; i < touches.length; i++) { touches[i]["clicked"] = false}
	for (let key in keys.clicked) {
		if (keys.clicked[key]) {
			keys.clicked[key] = false;
		}
	}
}, 1000 / 60);