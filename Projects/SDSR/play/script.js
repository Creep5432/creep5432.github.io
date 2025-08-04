const playerColors = ["", "fbff00", "0048ff"]


// Elements
const stream = document.getElementById("stream");
const microphone = document.getElementById("vc-mic");
const playScreen = document.getElementById("connectScreen");
const gameScreen = document.getElementById("gameScreen");
const joystick = document.querySelector('virtual-joystick');
const chat = document.getElementById("chat");
const chatButton = document.getElementById("chatbutton");

let microphoneStream = null;
let connectedVcPeers = [];
let lastMovePacket = "";

// Joystick
const handleKeyEvents = () => {
    joystick.dataset.release.split('').forEach(() => { });
    joystick.dataset.capture.split('').forEach(() => { });
};
joystick.addEventListener('joystickdown', handleKeyEvents);
joystick.addEventListener('joystickmove', handleKeyEvents);
joystick.addEventListener('joystickup', handleKeyEvents);

// functions
function distanceBetween(object1, object2) {return Math.sqrt(Math.pow(object1.x - object2.x, 2) + Math.pow(object1.y - object2.y, 2));}
function angleBetween(object1, object2) {return Math.atan2((object2.y) - (object1.y), object2.x - object1.x);}
function clamp(value, min, max) {return Math.min(Math.max(value, min), max);}

async function initConn() {
    playScreen.style.display = "none";

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
                remote.send("3Another player is on!");

                chatbutton.onclick = () => {
                    const text = document.createElement("input");
                    text.type = "text";

                    text.style = "fixed";
                    text.style.bottom = "25%";
                    text.style.left = "0";


                    document.body.appendChild(text);

                    text.focus();

                    if ('virtualKeyboard' in navigator && navigator.virtualKeyboard.show) {
                        navigator.virtualKeyboard.show();
                    }

                    text.addEventListener("focusout", (event) => {
                        remote.send("3" + text.value);
                        document.body.removeChild(text);
                    });

                    text.addEventListener("keydown", (event) => {
                        if (event.key === "Enter") {
                            remote.send("3" + text.value);
                            document.body.removeChild(text);
                        }
                    })
                };


                gameScreen.style.display = "block";
                const sendMovePacket = (j) => {
                    const joyInp = {
                        x: Math.cos(joystick.dataset.radian) * (joystick.dataset.distance / 65),
                        y: (Math.sin(joystick.dataset.radian) * (joystick.dataset.distance / 65))*-1
                    }
                    let res = "1";
                    const ang = angleBetween({ x: 0, y: 0 }, joyInp)
                    const dist = (joyInp.x == 0 && joyInp.y == 0) ? 0 : clamp(distanceBetween({ x: 0, y: 0 }, joyInp), 0.5, 1);
                    const inp = { x: (Math.cos(ang) * dist), y: Math.sin(ang) * dist }

                    res += String(String.fromCharCode(Math.round(inp.x * 32767) + 32767));
                    res += String(String.fromCharCode(Math.round(inp.y * -32767) + 32767));

                    if (res === lastMovePacket && (Math.random() < 0.75)) { return; }
                    lastMovePacket = res;

                    remote.send(res);
                }

                remote.on("data", (data) => {
                    if (typeof(data) == "string" && data.startsWith("3")) {
                        chat.innerText = data.substring(1, data.length);
                    }
                });

                document.getElementById("replayButton").onclick = () => { remote.send("2") }
                setInterval(() => {sendMovePacket(joystick)}, (1000 / 10))

                peer.on("call", (call) => {
                    call.answer();
                    call.on("stream", (getStream) => {
                        if ("srcObject" in stream) {
                            stream.srcObject = getStream
                        } else {
                            stream.src = URL.createObjectURL(getStream)
                        }
                        stream.play();
                    })
                    call.peerConnection.addEventListener('negotiationneeded', async () => {
                        const offer = await call.peerConnection.createOffer();
                        const modifiedSDP = forceH264(offer.sdp);
                        const newOffer = new RTCSessionDescription({
                            type: 'offer',
                            sdp: modifiedSDP
                        });
                        await call.peerConnection.setLocalDescription(newOffer);
                    });
                });
            });
        });
        peer.on("error", (e) => {
            throw new Error(e)
        })
    })
}

function forceH264(sdp) {
    const sdpLines = sdp.split('\r\n');

    const mLineIndex = sdpLines.findIndex(line => line.startsWith('m=video'));
    if (mLineIndex === -1) return sdp;

    const h264Payloads = sdpLines
        .filter(line => line.startsWith('a=rtpmap') && /H264/.test(line))
        .map(line => line.match(/^a=rtpmap:(\d+) H264/i)?.[1])
        .filter(Boolean);

    if (h264Payloads.length === 0) return sdp;

    const mLineParts = sdpLines[mLineIndex].split(' ');
    const newMLine = [...mLineParts.slice(0, 3), ...h264Payloads].join(' ');
    sdpLines[mLineIndex] = newMLine;

    return sdpLines.join('\r\n');
}

window.onerror = (e) => {
    alert(e)
}