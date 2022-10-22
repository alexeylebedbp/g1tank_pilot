import {useState} from "react"
import {wsConst} from "./credentials"
import {WSCallback} from "./types/TransportTypes"
import {ExtendedWebSocket} from "./types/PeerConnectionTypes";

export function useSocket(){
    const [socket, setSocket] = useState<WebSocket | undefined>(undefined)
    const [socketConnected, setSocketConnected] =  useState(false)

    const _send = (message: Object) => {
        socket!.send(JSON.stringify(message))
    }

    const _cleanup = (onMessageCallback: WSCallback) => {
        setSocketConnected(false)
        setSocket(undefined)
        onMessageCallback({action: "close"})
    }

    const _connect = (onMessageCallback: WSCallback, timeout: NodeJS.Timeout, resolve: any) => {
        const socket = new WebSocket(wsConst.address)
        socket.onopen = (event) => {
            console.log("Socket Connected", socket)
            clearTimeout(timeout)
            resolve()
            setSocketConnected(true)
            _send({
                action: wsConst.outMessages.auth_session,
                pilot_id: wsConst.pilot_id
            })
            _send({
                action: wsConst.outMessages.webrtc_can_answer
            })
        }

        socket.onmessage = (event) => {
            if(event.data === wsConst.inMessages.ping){
                socket.send(wsConst.outMessages.pong);
            } else if(event.data === wsConst.inMessages.red){
                console.warn("Poor network detected")
            } else {
                const message = JSON.parse(event.data)
                onMessageCallback(message, socket as ExtendedWebSocket)
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