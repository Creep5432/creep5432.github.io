const stream = document.getElementById("stream");

window.onerror = (error, url, line) => {
    const text = new Text(error.toString(), -400, 240, 16, "red", "left")
    text.bold = true;

    text.tick = () => {
        text.y += -1;
    }

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
const joy = new MobileJoystick(-325, 105, 200);
joy.color = "white";
joy.stickColor = "white";
joy.baseSize /= 3;
joy.stickSize /= 3;

joy.tick = () => {
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
    joy.input.y += yAx/1.25;

}

const replay = new Button("", 0, 135, 220, 85, "#FFFFFF00");
replay.bold = true;

const swap = new Button("Left Joystick", 360, -215, 120, 35, "#FFFFFF20");
swap.onclick = function () {
    swap.text = swap.text=="Left Joystick"?"Right Joystick":"Left Joystick"
    joy.x *= -1
}
canvasItems.push(swap)

var conText = null;

const emotesPopUp = new Button("💬", -400, -210, 50, 50, "black");
emotesPopUp.toggle = false;
emotesPopUp.onclick = () => {
    emotesPopUp.toggle = !emotesPopUp.toggle
    if (emotesPopUp.toggle) {
        initEmotes()
    } else {
        for (let item of Array.from(canvasItems)) {
            if ("tag" in item && item.tag === "emote") {
                const idx = canvasItems.indexOf(item);
                if (idx >= 0) {
                    canvasItems.splice(idx, 1);
                }
            }
        }
    }
}
//canvasItems.push(emotesPopUp)

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

runtime.beforeTick = function () {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(stream, 0, 0, canvas.clientWidth, canvas.clientHeight)
}



// EMOTES
function initEmotes () {
    const emotes = [
        {abr: "GG!", taunt: "GG!"},
        {abr: "Supreme!", taunt: "The Supreme Duelist!"},
        {abr: "Yeah!", taunt: "Yeah!"},
        {abr: "SD...", taunt: "Self Death..."},
        {abr: "lol", taunt: "lol"},
        {abr: "Lag!!!", taunt: "Lag!!!"},
        {abr: "WTF?!", taunt: "What the fuck?!"},
        {abr: "Blast you!", taunt: "Blast you!"},
        {abr: "Good job!", taunt: "Good job!"},
        {abr: "Thanks!", taunt: "Thanks!"},
        {abr: "You good?", taunt: "You good?"},
        {abr: "No.", taunt: "No."},
        {abr: "Muahaha!", taunt: "Muahaha!"},
        {abr: "Oopsies.", taunt: "Oopsies."},
        {abr: "THROWING!", taunt: "STOP THROWING!"},
        {abr: "Nice.", taunt: "Nice."},
    ]
    for (let i = 0; i < emotes.length; i++) {
        const emoteButton = new Button(emotes[i]["abr"], -320 + (95*Math.floor(i/6)), -225+(((i%6))*25), 90, 20, "#00990075");
        emoteButton.tag = "emote"
        emoteButton.onclick = function () {
            remote.send({celebrate: true, celType: emotes[i]["taunt"]})
        }
        canvasItems.push(emoteButton);
        emotesObjs.push(emoteButton);
    }
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
        console.log(txt);
        const peer = new Peer(null, { debug: 2 });
        peer.on("open", (id) => {
            remote = peer.connect(txt.replaceAll("\"", ""));
            remote.on("open", () => {
                connected = true;
                changeState("game");

                replay.onclick = function () {
                    remote.send({ replay: true })
                }

                setInterval(function () {
                    const ang = angleBetween({ x: 0, y: 0 }, joy.input)
                    const dist = (joy.input.x == 0 && joy.input.y == 0) ? 0 : clamp(distanceBetween({ x: 0, y: 0 }, joy.input), 0.5, 1)

                    const inp = {
                        x: (Math.cos(ang) * dist),
                        y: Math.sin(ang) * dist
                    }

                    remote.send({
                        xJoy: inp.x,
                        yJoy: inp.y * -1,
                        id: id
                    });
                }, (1000 / 15))

                remote.on("data", (data) => {
                    const dat = data;
                    console.log(dat)
                    if ("slot" in dat) {
                        joy.color = (dat.slot == 1) ? "#fbff0035" : "#0048ff35"
                        joy.stickColor = (dat.slot == 1) ? "#fbff0099" : "#0048ff99"
                    }
                    if ("celebrate" in dat) {
                        const cel = new Text(dat["celebrate"], rand(-100, 100), 200, 16, "white", "center");
                        cel.color = dat["celSlot"] == 0 ? "white" : (dat["celSlot"] == 1 ? "#fbff00" : "#0048ff")
                        cel.bold = true;

                        cel.tick = function () {
                            cel.y -= 0.5;
                            cel.size += 1 / 20
                        }

                        uiCanvasItems.push(cel);

                        setTimeout(() => {
                            const idx = uiCanvasItems.indexOf(cel)
                            if (idx !== -1) {
                                uiCanvasItems.splice(idx, 1)
                            }
                        }, 3500)
                    }
                })

                peer.on("call", (call) => {
                    console.log("Answering call");
                    call.answer();

                    call.on("stream", (getStream) => {
                        console.log("Got stream")
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