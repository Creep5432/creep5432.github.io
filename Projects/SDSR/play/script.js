// Elements
const stream = document.getElementById("stream");
const microphone = document.getElementById("vc-mic");
const vcAudio = document.getElementById("vc-audio");
const playScreen = document.getElementById("connectScreen");
const gameScreen = document.getElementById("gameScreen");
const joystick = document.querySelector('virtual-joystick');

let microphoneStream = null;

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

// init vc
async function initVCObject() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((audio) => {
            if ("srcObject" in microphone) {
                microphone.srcObject = audio
            } else {
                microphone.src = URL.createObjectURL(audio)
            }
            microphoneStream = audio;
            microphone.muted = true;
            microphone.play();
        })
        .catch((r) => {
            console.error(r);
        })
}

async function initConn() {
    const color = ["","fbff00","0048ff"]
    playScreen.style.display = "none";

    const enableVC = confirm("This application has voice chat. Do you want to connect to voice chat?");

    if (enableVC) {await initVCObject()}

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

                    remote.send(res);
                }

                document.getElementById("replayButton").onclick = () => { remote.send("2") }
                setInterval(() => {sendMovePacket(joystick)}, (1000 / 20))

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

            if (enableVC) {
                const vc = peer.call(`${txt.replaceAll("\"", "")}-voicechat`, microphoneStream);
                vc.on("stream", (a) => {
                    if ("srcObject" in vcAudio) {
                        vcAudio.srcObject = a
                    } else {
                        vcAudio.src = URL.createObjectURL(a)
                    }

                    alert("vc connected...")
                    vcAudio.play()
                })
            }
        });
        peer.on("error", (e) => {
            throw new Error(e)
        })
    })
}

window.onerror = (e) => {
    alert(e)
}