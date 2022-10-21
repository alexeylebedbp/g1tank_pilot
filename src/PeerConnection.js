import {wsConst} from "./credentials"

const rtcMakeCallTimeoutSeconds = 10
const noop = () => {}


const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};


class WebRtcPeerConnectionImpl {

    constructor(transport) {
        this.transport = transport
    }

    peerConnection = undefined
    voiceElement = undefined
    videoElement = undefined
    localStream = undefined
    timeout = undefined
    iceCandidateQueue = []
    withVideo = true

    setTimeout(type, callback) {
        this.timeout = setTimeout(() => {
            this.cleanup()
            callback(new Error(`WebRTC ${type} error: timeout`))
        }, 1000 * rtcMakeCallTimeoutSeconds)
    }

    clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout)
            delete this.timeout
        }
    }

    cleanup() {
        this.clearTimeout()
        this.iceCandidateQueue = []
        this.withVideo = false

        if (this.peerConnection) {
            this.dropCall()
        }
    }

    sendAudioStreamToHtml(stream) {
        this.voiceElement = document.createElement('audio')
        this.voiceElement.autoplay = true
        this.voiceElement.srcObject = stream
        const root = document.getElementById("root")
        console.log("Appending Voice El to Root")
        root.appendChild(this.voiceElement)
    }

    sendVideoStreamToHtml(stream) {
        this.videoElement = document.createElement('video')
        this.videoElement.autoplay = true
        this.videoElement.srcObject = stream
        const canvas = document.getElementById("myCanvas")
        this.videoElement.height = canvas.height
        this.videoElement.width = canvas.width
        this.videoElement.addEventListener('play', function() {
            let $this = this;
            (function loop() {
                if (!$this.paused && !$this.ended) {
                    const ctx = canvas.getContext("2d")
                    // ctx.scale(-1, 1);
                    // ctx.save();
                    // ctx.rotate(180 * Math.PI/180);
                    // ctx.drawImage($this, 0, -canvas.height, canvas.width, canvas.height);
                    // ctx.restore();
                    ctx.save();
                    ctx.rotate(180 * Math.PI/180);
                    ctx.drawImage($this, -canvas.width, -canvas.height, canvas.width, canvas.height);
                    ctx.restore();
                    setTimeout(loop, 1000 / 30); // drawing at 30fps
                }
            })();
        }, 0);
        // const root = document.getElementById("root")
        // console.log("Appending Video El to Root", this.videoElement)
        // root.appendChild(this.videoElement)
    }

    onAnswer(serverSdp) {
        if (this.peerConnection) {
            this.clearTimeout()
            const sessionDesc = new RTCSessionDescription({type: 'answer', sdp: serverSdp})
            this.peerConnection.setRemoteDescription(sessionDesc).then(()=>{
                console.log(140, this.peerConnection.signalingState, this.peerConnection)
            })
            if (this.iceCandidateQueue.length) {
                this.iceCandidateQueue.forEach(c => this.onIceCandidate(c))
                this.iceCandidateQueue = []
            }
        }
    }

    onLocalIceCandidate(e) {
        console.log("onLocalIceCandidate", e.candidate)
        if(e.candidate){
            this.transport.send(JSON.stringify({
                action: wsConst.outMessages.answer_ice,
                candidate: e.candidate
            }))
        }
    }

    onRemoteIceCandidate(e){
        console.log("onRemoteIceCandidate", e)
        this.peerConnection.addIceCandidate(e.candidate)
    }

    answerCall(serverSdp) {
        this.cleanup()

        return new Promise((resolve, reject) => {
            //this.setTimeout('answerCall', reject)
            this.peerConnection = new RTCPeerConnection()

            this.peerConnection.onicecandidate = e => {
                this.onLocalIceCandidate(e)
            }

            this.peerConnection.ontrack = e => {
                if (e.track.kind === 'audio') {
                    this.sendAudioStreamToHtml(e.streams[0])
                } else if (e.track.kind === 'video') {
                    this.sendVideoStreamToHtml(e.streams[0])
                }
            }

            const sessionDesc = new RTCSessionDescription({sdp: serverSdp, type: 'offer'})
            this.peerConnection.setRemoteDescription(sessionDesc)
            .then(() => {
                return this.peerConnection.createAnswer()
            })
            .then((localDescription) => {
                return this.peerConnection.setLocalDescription(localDescription)
            })
            .then(() => {
                resolve(this.peerConnection.localDescription)
            })
            .catch(e => {
                this.cleanup()
                reject(e)
            })
        })
    }

    dropCall() {
        if (this.voiceElement) {
            this.voiceElement.pause()
            this.voiceElement.removeAttribute('srcObject')
            this.voiceElement.remove()
            delete this.voiceElement
        }
        if (this.videoElement) {
            this.videoElement.pause()
            this.videoElement.removeAttribute('srcObject')
            this.videoElement.remove()
            delete this.videoElement
        }
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop())
            delete this.localStream
        }
        if (this.peerConnection) {
            this.peerConnection.onicecandidate = null
            this.peerConnection.ontrack = null
            this.peerConnection.close()
            delete this.peerConnection
        }
    }

}

function createWebRtcPeerConnection(transport) {
    return new WebRtcPeerConnectionImpl(transport)
}

export {createWebRtcPeerConnection}
