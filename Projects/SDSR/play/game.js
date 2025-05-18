const stream = document.getElementById("stream");

window.onerror = (error, url, line) => {
    const text = new Text(error.toString(), -400, 240, 16, "red", "left")
    text.bold = true;

    text.tick = () => {text.y += -1;}

    uiCanvasItems.push(text);
}

if (!isWebRTCSupported()) {
    alert("Your device doesn't support webrtc...")
}

var gameState = "game";
var isAttacking = false;
var replayDetect = 0;
var lastId = 0;
var connected = false;

var emotesObjs = [];
var remote = null


// Gameobject init shit
const joy = new MobileJoystick(325, 105, 200);
joy.color = "white";
joy.stickColor = "white";
joy.baseSize /= 3;
joy.stickSize /= 3;

joy.onLetGo = () => {}
joy.tick = () => {
    if (joy.last !== joy.input) {
        if (joy.input === { x: 0, y: 0 }) {
            joy.onLetGo();
        }
        joy.last = joy.input;
    }
    const xAx = (keys["held"]["d"]?1:0) - (keys["held"]["a"]?1:0)
    const yAx = (keys["held"]["s"]?1:0) - (keys["held"]["w"]?1:0)
    if (xAx!==0||yAx!==0) {
        joy.resetOnLetGo = false;
    } else if (joy.resetOnLetGo==false) {
        joy.input.x /= 3;
        joy.input.y /= 3;

        if (Math.abs(joy.input.x) < 0.02) {
            joy.input.x = 0;
        }
        if (Math.abs(joy.input.y) < 0.02) {
            joy.input.y = 0;
        }
    }

    joy.input.x += xAx/1.25;
    joy.input.y += yAx / 1.25;
}

const replay = new Button("", 0, 135, 220, 85, "#FFFFFF00");
replay.bold = true;

const swap = new Button("Right Joystick", 360, -215, 120, 35, "#FFFFFF20");
swap.onclick = () => {
    swap.text = swap.text=="Left Joystick"?"Right Joystick":"Left Joystick"
    joy.x *= -1;
}
canvasItems.push(swap)

var conText = null;

var imgStream = document.createElement("img");
var imgBuffer = document.createElement("img");

var ws = null;

const connect = new Button("Connect ig", 0, 0, 200, 64, "green");
connect.onclick = () => {
    initConn()
}
uiCanvasItems.push(connect);

function changeState(state) {
    gameState = state;
    const joyIdx = uiCanvasItems.indexOf(joy);
    const replayIdx = uiCanvasItems.indexOf(replay);
    if (joyIdx == -1) { uiCanvasItems.push(joy) }
    if (replayIdx == -1) { uiCanvasItems.push(replay) }
}

runtime.beforeTick = () => {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(stream, 0, 0, canvas.clientWidth, canvas.clientHeight)
}

function between(val, min, max) {
    return (val > min && val < max)
}

function isWebRTCSupported() {
    return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)
}

function initConn() {
    uiCanvasItems.splice(uiCanvasItems.indexOf(connect), 1);
    fetch("https://creep5432-sdsr-default-rtdb.firebaseio.com/hostPeer.json").then((res) => {
        if (!res.ok) {
            throw new Error("Couldn't get host's ID ):")
        }
        return res.text()
    }).then((txt) => {
        const peer = new Peer(null, { debug: 2 });
        peer.on("open", (id) => {
            remote = peer.connect(txt.replaceAll("\"", ""));
            remote.on("open", () => {

                const sendMovePacket = (j) => {
                    let res = "1";
                    const ang = angleBetween({ x: 0, y: 0 }, j.input)
                    const dist = (j.input.x == 0 && j.input.y == 0) ? 0 : clamp(distanceBetween({ x: 0, y: 0 }, j.input), 0.5, 1);
                    const inp = { x: (Math.cos(ang) * dist), y: Math.sin(ang) * dist }

                    res += String(String.fromCharCode(Math.round(inp.x * 32767) + 32767));
                    res += String(String.fromCharCode(Math.round(inp.y * -32767) + 32767));

                    remote.send(res);
                }
                joy.onLetGo = () => {sendMovePacket(joy.last);}
                connected = true;
                changeState("game");

                replay.onclick = function () {remote.send("2")}
                setInterval(function () {sendMovePacket(joy)}, (1000 / 20))

                remote.on("data", (data) => {
                    const dat = data;
                    if ("slot" in dat) {
                        joy.color = (dat.slot == 1) ? "#fbff0035" : "#0048ff35"
                        joy.stickColor = (dat.slot == 1) ? "#fbff0099" : "#0048ff99"
                    }
                })

                peer.on("call", (call) => {
                    call.answer();
                    call.on("stream", (getStream) => {
                        if ("srcObject" in stream) {
                            stream.srcObject = getStream
                        } else {
                            stream.src = URL.createObjectURL(getStream)
                        }
                        stream.play()
                    })
                });
            });
        });
        peer.on("error", (e) => {
            throw new Error(e)
        })
    })
}