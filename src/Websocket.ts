import {useState} from "react"
import {constants} from "./credentials"
import {WSCallback} from "./types/TransportTypes"
import {ExtendedWebSocket} from "./types/PeerConnectionTypes";

export function useSocket(){
    const [socket, setSocket] = useState<WebSocket | undefined>(undefined)
    const [socketConnected, setSocketConnected] =  useState(false)

    const _cleanup = (onMessageCallback: WSCallback) => {
        setSocketConnected(false)
        setSocket(undefined)
        onMessageCallback({action: "close"})
    }

    const _connect = (onMessageCallback: WSCallback, timeout: NodeJS.Timeout, resolve: any) => {
        const socket = new WebSocket(constants.address)
        socket.onopen = (event) => {
            console.log("Socket Connected", socket)
            clearTimeout(timeout)
            resolve()
            setSocketConnected(true)
            socket.send(JSON.stringify({
                action: constants.outMessages.auth_session,
                pilot_id: constants.pilot_id
            }))
            socket.send(JSON.stringify({
                action: constants.outMessages.webrtc_can_answer
            }))
        }

        socket.onmessage = (event) => {
            if(event.data === constants.inMessages.ping){
                socket.send(constants.outMessages.pong);
            } else if(event.data === constants.inMessages.poor_network){
                console.warn("Poor network detected")
            } else {
                try {
                    const message = JSON.parse(event.data)
                    onMessageCallback(message, socket as ExtendedWebSocket)
                } catch (e){
                    console.error(e)
                }
            }
        }

        socket.onerror = (event) => {
            console.error("WebSocket error:", event)
            _cleanup(onMessageCallback)
        }

        socket.onclose = (event) => {
            console.warn("WebSocket close:", event)
            _cleanup(onMessageCallback)
        }

        setSocket(socket)
    }

    const connectSocket = (onMessageCallback: WSCallback) => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(()=>{
                reject()
            }, 2000)
            _connect(onMessageCallback, timeout, resolve as any)
        })
    }

    return {connectSocket, socket, socketConnected}
}