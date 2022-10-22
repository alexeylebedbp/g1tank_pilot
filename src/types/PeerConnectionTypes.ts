import {WebRTCRemoteIce} from "./TransportTypes";

type ClientSdp = string

export interface IceCandidate {
    readonly candidate: string
    readonly sdpMid: string
    readonly sdpMLineIndex: number
}


export interface WebRtcPeerConnection {
    onAnswer(serverSdp: string): void
    answer(serverSdp: string): Promise<RTCSessionDescription | null>
    onRemoteIceCandidate(iceCandidate: WebRTCRemoteIce): void
    onLocalIceCandidate(c: RTCIceCandidate | null):void
    dropConnection(): void
    togglePhoneSpeaker?(isOn: boolean): void
    toggleVideoCamera?(isOn: boolean): void
    getStats?(): void
    cleanup():void
}

export interface ExtendedWebSocket extends WebSocket {
    peerConnection: WebRtcPeerConnection | undefined
}


export interface WebRtcIceServer {
    urls: string | string[]
    username?: string
    credential?: string
}

export interface WebRtcPeerConfig {
    iceServers: WebRtcIceServer[]
}
