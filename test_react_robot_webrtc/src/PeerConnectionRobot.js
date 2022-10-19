
const rtcMakeCallTimeoutSeconds = 10
const noop = () => {}

const configuration = {
    // iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};


class WebRtcPeerConnectionImpl {

    constructor(transport) {
        this.transport = transport
    }

    peerConnection = undefined
    voiceElement = undefined
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


    togglePhoneSpeaker(isOn) {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                if (track.kind === 'audio') {
                    track.enabled = isOn
                }
            })
        }
    }

    toggleVideoCamera(isOn) {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                if (track.kind === 'video') {
                    track.enabled = isOn
                }
            })
        }
    }

    sendAudioStreamToHtml(stream) {
        this.voiceElement = document.createElement('audio')
        this.voiceElement.autoplay = true
        this.voiceElement.srcObject = stream
        const root = document.getElementById("app")
        console.log("Appending Voice El to Root")
        root.appendChild(this.voiceElement)
    }

    sendVideoStreamToHtml(stream) {
        this.videoElement = document.createElement('video')
        this.videoElement.autoplay = true
        this.videoElement.srcObject = stream
        const root = document.getElementById("app")
        console.log("Appending Video El to Root", this.videoElement)
        root.appendChild(this.videoElement)
    }

    onLocalIceCandidate(e) {
        if(e.candidate){
            this.transport.send(JSON.stringify({
                action: "offer_ice",
                candidate: e.candidate
            }))
        }
    }

    onRemoteIceCandidate(e){
        console.log("addRemoteIceCandidate", e)
        this.peerConnection.addIceCandidate(e.candidate)
    }


    makeCall(withVideo){
        this.cleanup()
        this.withVideo = withVideo

        return new Promise((resolve, reject) => {
            // this.setTimeout('makeCall', () => {
            //     console.log("makeCall timout")
            // })

            try {
                this.peerConnection = new RTCPeerConnection(configuration)
            } catch (e) {
                this.cleanup()
                return reject(e)
            }

            this.peerConnection.onicecandidate = e => {
                this.onLocalIceCandidate(e)
            }

            navigator.mediaDevices.getUserMedia({video: true, audio: true})
                .then((stream) => {
                    stream.getTracks().forEach(track => {
                        this.peerConnection.addTrack(track, stream)
                        console.log("localStream", stream)
                        console.log("localTrack", track)
                    })
                    this.peerConnection.createOffer()
                    .then(offer => {
                        return this.peerConnection.setLocalDescription(offer)
                    })
                    .then(()=> {
                        resolve(this.peerConnection.localDescription.sdp || '')
                    })
                    .catch(e => {
                        this.cleanup()
                        return reject(e)
                    })
                })
        })
    }

    onAnswer(serverSdp) {
        if (this.peerConnection) {
            this.clearTimeout()
            const sessionDesc = new RTCSessionDescription({type: 'answer', sdp: serverSdp})
            this.peerConnection.setRemoteDescription(sessionDesc)

            if (this.iceCandidateQueue.length) {
                this.iceCandidateQueue.forEach(c => this.onIceCandidate(c))
                this.iceCandidateQueue = []
            }
        }
    }



    dropCall() {
        if (this.voiceElement) {
            this.voiceElement.pause()
            this.voiceElement.removeAttribute('srcObject')
            this.voiceElement.remove()
            delete this.voiceElement
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
