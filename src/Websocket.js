import React, {useState} from "react"
import {wsConst} from "./credentials"

export function useSocket(){
    const [socket, setSocket] = useState(undefined)
    const [socketConnected, setSocketConnected] =  useState(false)

    const _connect = (onMessageCallback, timeout, resolve) => {
        const socket = new WebSocket(wsConst.address)
        socket.onopen = (event) => {
            console.log("Socket Connected")
            clearTimeout(timeout)
            resolve()
            setSocketConnected(true)
            socket.send(JSON.stringify({
                action: wsConst.outMessages.auth_session,
                pilot_id: wsConst.pilot_id
            }))
            socket.send(JSON.stringify({
                action: "webrtc_can_answer",
            }))
        }

        socket.onerror = (event) => {
            console.log(event)
        }

        socket.onmessage = (event) => {
            if(event.data === wsConst.inMessages.ping){
                socket.send(wsConst.outMessages.pong);
            } else if(event.data === wsConst.inMessages.red){
                console.log("Poor network detected")
            }  else {
                const message = JSON.parse(event.data)
                console.log(message.action)
                onMessageCallback(message, socket)
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

    const connectSocket = (onMessageCallback) => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(()=>{
                reject()
            }, 2000)
            _connect(onMessageCallback, timeout, resolve)
        })
    }



    return {connectSocket, socket, socketConnected}
}