import React, {useState} from "react"
import {wsConst} from "./credentials"

export function useSocket(){
    const [socket, setSocket] = useState(undefined)
    const [socketConnected, setSocketConnected] =  useState(false)

    const connectSocket = (onMessageCallback) => {
        const socket = new WebSocket(wsConst.address)

        socket.onopen = (event) => {
            console.log("Socket Connected")
            setSocketConnected(true)
            socket.send(JSON.stringify({
                action: wsConst.outMessages.auth_session,
                pilot_id: wsConst.pilot_id
            }))
        }

        socket.onerror = (event) => {
            console.log(event)
        }

        socket.onmessage = (event) => {
            console.log(event.data);
            if(event.data === wsConst.inMessages.ping){
                socket.send(wsConst.outMessages.pong);
            } else if(event.data === wsConst.inMessages.red){
                console.log("Poor network detected")
            }  else {
                const message = JSON.parse(event.data)
                onMessageCallback(message)
            }
        }

        socket.onclose = (event) => {
            console.log("Socket Closed")
            setSocketConnected(false)
            setSocket(undefined)
            onMessageCallback({action: "close"})
        }

        setSocket(socket)
    }



    return {connectSocket, socket, socketConnected}
}