import {constants} from "./credentials"
import {WebRtcPeerConnection, IceCandidate} from './types/PeerConnectionTypes'
import {sendStreamToCanvas} from "./Canvas";
import {WebRTCRemoteIce} from "./types/TransportTypes";
const rtcMakeCallTimeoutSeconds = 10

export class WebRtcPeerConnectionImpl implements WebRtcPeerConnection{

    transport: WebSocket
    peerConnection: RTCPeerConnection | undefined = undefined
    videoElement: HTMLVideoElement | undefined = undefined
    localStream: MediaStream | undefined = undefined
    timeout: ReturnType<typeof setTimeout> | undefined = undefined
    withVideo: boolean = true

    constructor(transport: WebSocket) {
        this.transport = transport
    }

    onLocalIceCandidate(candidate: RTCIceCandidate | null) {
        if(candidate){
            this.transport.send(JSON.stringify({
                action: constants.outMessages.answer_ice,
                candidate: candidate
            }))
        }
    }

    onRemoteIceCandidate(e: WebRTCRemoteIce){
        console.log("onRemoteIceCandidate", e)
        this.peerConnection!.addIceCandidate(e.candidate)
    }

    answer(serverSdp: string): Promise<RTCSessionDescription | null> {
        this.cleanup()
        return new Promise((resolve, reject) => {
            this._setTimeout('answerCall', reject)
            this.peerConnection = new RTCPeerConnection()

            this.peerConnection.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
                this.onLocalIceCandidate(e.candidate)
            }

            this.peerConnection.ontrack = (e: RTCTrackEvent) => {
                if (e.track.kind === 'video') {
                    this.videoElement = sendStreamToCanvas(e.streams[0])
                }
            }

            const sessionDesc = new RTCSessionDescription({sdp: serverSdp, type: 'offer'})

            this.peerConnection.setRemoteDescription(sessionDesc)
            .then(() => {
                return this.peerConnection!.createAnswer()
            })
            .then((localDescription) => {
                return this.peerConnection!.setLocalDescription(localDescription)
            })
            .then(() => {
                this._clearTimeout()
                resolve(this.peerConnection!.localDescription)
            })
            .catch(e => {
                this.cleanup()
                reject(e)
            })
        })
    }

    dropConnection() {
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

    cleanup() {
        this._clearTimeout()
        this.withVideo = false

        if (this.peerConnection) {
            this.dropConnection()
        }
    }

    _setTimeout(type: string, callback: (p: string | Error) => void): void {
        this.timeout = setTimeout(() => {
            this.cleanup()
            callback(new Error(`WebRTC ${type} error: timeout`))
        }, 1000 * rtcMakeCallTimeoutSeconds)
    }

    _clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout)
            delete this.timeout
        }
    }

}

function createWebRtcPeerConnection(transport: WebSocket) {
    return new WebRtcPeerConnectionImpl(transport)
}

export {createWebRtcPeerConnection}
