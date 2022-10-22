import {ExtendedWebSocket} from "./PeerConnectionTypes"

export interface WSMessage {
    action: string
}

export interface WebRTCOffer extends WSMessage{
    sdp: string
}

export interface WebRTCRemoteIce extends WSMessage{
    candidate: RTCIceCandidate
    type: string
}

export type WSCallback = (message: WSMessage, transport?: ExtendedWebSocket) => void