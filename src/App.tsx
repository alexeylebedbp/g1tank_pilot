import React, {useEffect, useState, useCallback, useRef} from "react"
import {Canvas} from "./Canvas"
import {MoveCommandButton} from "./MoveCommandButton"
import {useSocket} from "./Websocket"
import {createWebRtcPeerConnection} from "./PeerConnection"
import {ExtendedWebSocket, WebRtcPeerConnection} from "./types/PeerConnectionTypes";
import {KeyboardController} from  "./KeyboardController"
import {WebRTCOffer, WebRTCRemoteIce, WSMessage} from "./types/TransportTypes"
import './css/App.css'
import {constants} from "./credentials"

const App: React.FC = () => {
    const {connectSocket, socket, socketConnected} = useSocket()
    const [carConnected, setCarConnected] = useState(false)
    const [keyboardController, setKeyboardController] = useState<KeyboardController | undefined>(undefined)
    const [peerConnection, setPeerConnection] = useState<WebRtcPeerConnection | undefined>(undefined)

    const handleMouseDown = keyboardController ? keyboardController.handleMouseDown : undefined
    const handleMouseUp = keyboardController ? keyboardController.handleMouseUp : undefined
    const handleClick = keyboardController ? keyboardController.handleClick : undefined


    const onTransportMessage = (message: WSMessage, transport?: ExtendedWebSocket) => {
        switch (message.action) {
            case constants.inMessages.car_control_obtained:
                onTransportCarControlObtained(transport!)
                break
            case constants.inMessages.failed_to_obtain_car_control:
                onTransportControlFailed()
                break
            case constants.inMessages.close:
                onTransportClose()
                break
            case constants.inMessages.car_disconnected:
                setCarConnected(false)
                break
            case constants.inMessages.webrtc_offer:
                onTransportWebRTCOffer(message, transport!)
                break
            case  constants.inMessages.offer_ice:
                onTransportWebRTCIce(message, transport!)
                break
            default:
                return
        }
    }

    useEffect(() => {
        socket &&
        socketConnected &&
        carConnected &&
        setKeyboardController(new KeyboardController(socket))
    }, [socket, socketConnected, carConnected])


    useEffect(()=> {
        if(keyboardController){
            document.addEventListener("keydown", keyboardController.handleKeyboardDown, false);
            document.addEventListener("keyup", keyboardController.handleKeyboardUp, false);
        }
    }, [keyboardController])


    useEffect(() => {
        return () => {
            if(keyboardController){
                document.removeEventListener("keydown", keyboardController.handleKeyboardDown, false);
                document.removeEventListener("keyup", keyboardController.handleKeyboardUp, false);
            }
        }
    }, [keyboardController])

    const onTransportClose = () => {
        keyboardController && document.removeEventListener("keydown", keyboardController.handleKeyboardDown, false);
        keyboardController && document.removeEventListener("keyup", keyboardController.handleKeyboardUp, false);
        setCarConnected(false)
        setKeyboardController(undefined)
    }

    const onTransportCarControlObtained = (transport: ExtendedWebSocket) => {
        setCarConnected(true)
        transport.send(JSON.stringify({
            action: constants.outMessages.offer_request,
            pilot_id: constants.pilot_id
        }))
    }

    const onTransportWebRTCOffer = (message: WSMessage, transport: ExtendedWebSocket) => {
        const m: WebRTCOffer = message as WebRTCOffer
        transport.peerConnection = createWebRtcPeerConnection(transport)
        const remoteSDP = m.sdp
        transport.peerConnection.answer(remoteSDP).then((answer: RTCSessionDescription | null) => {
            answer && transport.send(JSON.stringify({
                action: constants.outMessages.webrtc_answer,
                sdp: answer.sdp,
                type: answer.type,
                pilot_id: constants.pilot_id
            }))
            setPeerConnection(transport.peerConnection)
        })
    }

    const onTransportWebRTCIce = (message: WSMessage, transport: ExtendedWebSocket) => {
        const m: WebRTCRemoteIce = message as WebRTCRemoteIce
        transport.peerConnection &&
        transport.peerConnection.onRemoteIceCandidate(m)
    }

    const onTransportControlFailed = () => {
        console.warn("Failed to obtain car control, try again")
    }

    const stopServer = () => {
        if(socket){
            socket.send(JSON.stringify({action: "byebye", pilot_id: constants.pilot_id}))
            peerConnection &&
            peerConnection.cleanup()
            setPeerConnection(undefined)
        }
    }

    const getCarControl = useCallback(() => {
        socket &&
        socket.send(JSON.stringify({
            action: constants.outMessages.get_car_control,
            car_id: constants.car_id,
            pilot_id: constants.pilot_id
        }))
    }, [socket])


    const onConnectClick = () => {
        connectSocket(onTransportMessage)
            .catch((e)=>{
                console.log("Couldn't establish websocket connection. No response from the server.", e)
            })
    }

    return (
        <div className="App">
            <header className="App-header">
                <Canvas/>
                <p onClick={stopServer}>
                    G1 Tank Pilot
                </p>
                <button
                    className={!socketConnected ? "Connect-button" : "None"}
                    onClick={onConnectClick}>
                    Connect
                </button>
                <button
                    className={socketConnected && !carConnected ? "Connect-button" : "None"}
                    onClick={getCarControl}>
                    Get Car
                </button>
                <div className={carConnected ? "Control-buttons-wrapper" : "None"}>
                    <div className={"Control-buttons-line"}>
                        <MoveCommandButton
                            name={"up"}
                            handleMouseDown={handleMouseDown}
                            handleMouseUp={handleMouseUp}
                            handleClick={handleClick}
                        />
                    </div>
                    <div className={"Control-buttons-line"}>
                        <MoveCommandButton
                            name={"left"}
                            handleMouseDown={handleMouseDown}
                            handleMouseUp={handleMouseUp}
                            handleClick={handleClick}
                        />
                        <MoveCommandButton
                            name={"down"}
                            handleMouseDown={handleMouseDown}
                            handleMouseUp={handleMouseUp}
                            handleClick={handleClick}
                        />
                        <MoveCommandButton
                            name={"right"}
                            handleMouseDown={handleMouseDown}
                            handleMouseUp={handleMouseUp}
                            handleClick={handleClick}
                        />
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;
