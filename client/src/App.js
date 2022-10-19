import logo from './logo.svg';
import './App.css';
import {useEffect, useState, useCallback, useRef} from "react"
import {Canvas} from "./Canvas"
import {MoveCommandButton} from "./MoveCommandButton"
import {useSocket} from "./Websocket"
import {wsConst} from "./credentials"
import {createWebRtcPeerConnection} from "./PeerConnection"

class KeyBoardController {

    constructor(ws) {
        this.ws = ws
        this.leftBtnStateReporter = undefined
        this.rightBtnStateReporter = undefined
        this.upBtnStateReporter = undefined
        this.downBtnStateReporter =  undefined
    }

    mapCommandToDirection = (command) => {
        if (command === "left" || command === "right") return command
        if (command === "up") return "forward"
        if (command === "down") return "backward"
    }

    intervalFactory = (command) => {
        return setInterval(() => {
            if (this.ws) {
                console.log("Sending move command:", command)
                this.ws.send(JSON.stringify({
                    action: wsConst.outMessages.move,
                    direction: this.mapCommandToDirection(command),
                    pilot_id: wsConst.pilot_id
                }))
            }
        }, 1000/wsConst.frequency)
    }

    send = (command) => {
        if (command === "left") {
            if (!this.leftBtnStateReporter && this.ws) {
                this.leftBtnStateReporter = this.intervalFactory(command)
            }
        } else if (command === "right") {
            if (!this.rightBtnStateReporter && this.ws) {
                this.rightBtnStateReporter = this.intervalFactory(command)
            }
        } else if (command === "up") {
            if (!this.upBtnStateReporter && this.ws) {
                this.upBtnStateReporter = this.intervalFactory(command)
            }
        } else if (command === "down") {
            if (!this.downBtnStateReporter && this.ws) {
                this.downBtnStateReporter = this.intervalFactory(command)
            }
        }
    }

    ioUp = (e) => {
        if (!e) return
        if (e.target.id === "left") {
            this.leftBtnStateReporter && clearInterval(this.leftBtnStateReporter)
            this.leftBtnStateReporter = undefined
        } else if (e.target.id === "right") {
            this.rightBtnStateReporter && clearInterval(this.rightBtnStateReporter)
            this.rightBtnStateReporter = undefined
        } else if (e.target.id === "up") {
            this.upBtnStateReporter && clearInterval(this.upBtnStateReporter)
            this.upBtnStateReporter = undefined
        } else if (e.target.id === "down") {
            this.downBtnStateReporter && clearInterval(this.downBtnStateReporter)
            this.downBtnStateReporter = undefined
        }
    }

    ioDown = (e) => {
        if (!e) return
        if (e.target.id === "left") {
            this.send("left")
        } else if (e.target.id === "right") {
            this.send("right")
        } else if (e.target.id === "up") {
            this.send("up")
        } else if (e.target.id === "down") {
            this.send("down")
        }
    }

    handleMouseUp = (e) => {
        this.ioUp(e)
    }

    handleMouseDown = (e) => {
        this.ioDown(e)
    }

    mapEvent = (eventCode) => {
        if (eventCode === "ArrowUp") {
            return {target: {id: "up"}}
        } else if (eventCode === "ArrowDown") {
            return {target: {id: "down"}}
        } else if (eventCode === "ArrowLeft") {
            return {target: {id: "left"}}
        } else if (eventCode === "ArrowRight") {
            return {target: {id: "right"}}
        } else {
            return null
        }
    }

    handleKeyboardUp = (event) => {
        console.log("KeyUp:", event.code)
        this.ioUp(this.mapEvent(event.code))
    };

    handleKeyboardDown = (event) => {
        console.log("KeyDown:", event.code)
        this.ioDown(this.mapEvent(event.code))
    };

    handleClick = (e) => {
        if (!e.target) return
        this.ws.send(JSON.stringify({
            action: wsConst.outMessages.move,
            direction: this.mapCommandToDirection(e.target.id),
            pilot_id: wsConst.pilot_id
        }))
    }
}

function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

function App() {
    const {connectSocket, socket, socketConnected} = useSocket()
    const [carConnected, setCarConnected] = useState(false)
    const [keyboardController, setKeyboardController] = useState(undefined)
    const [peerConnection, setPeerConnection] = useState(undefined)

    const handleMouseDown = keyboardController ? keyboardController.handleMouseDown : undefined
    const handleMouseUp = keyboardController ? keyboardController.handleMouseUp : undefined
    const handleClick = keyboardController ? keyboardController.handleClick : undefined

    const onMessage = (message, transport) => {
        if (message.action === wsConst.inMessages.car_control_obtained) {
            setPeerConnection(createWebRtcPeerConnection(transport))
            setCarConnected(true)
        } else if(message.action === wsConst.inMessages.failed_to_obtain_car_control){
            console.warn("failed_to_obtain_car_control")
        } else if (message.action === wsConst.inMessages.close) {
            keyboardController && document.removeEventListener("keydown", keyboardController.handleKeyboardDown, false);
            keyboardController && document.removeEventListener("keyup", keyboardController.handleKeyboardUp, false);
            setCarConnected(false)
            setKeyboardController(undefined)
        } else if(message.action === "car_disconnected"){
            setCarConnected(false)
        } else if(message.action === wsConst.inMessages.webrtc_offer){
                const _peerConnection = createWebRtcPeerConnection(transport)
                transport.peerConnection = _peerConnection
                const remoteSDP = message.sdp
                _peerConnection.answerCall(remoteSDP).then(answer => {
                    transport.send(JSON.stringify({
                        action: "webrtc_answer",
                        sdp: answer.sdp,
                        type: answer.type
                    }))
                    console.log(_peerConnection.peerConnection.signalingState)
                    setPeerConnection(_peerConnection)
                })
        } else if(message.action === wsConst.inMessages.offer_ice){
            transport.peerConnection.onRemoteIceCandidate(message)
        }
    }


    useEffect(() => {
        socket &&
        socketConnected &&
        carConnected &&
        setKeyboardController(new KeyBoardController(socket))
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

    const stopServer = () => {
        socket &&
        socket.send(JSON.stringify({action: "byebye", pilot_id: wsConst.pilot_id}))
        peerConnection &&
        peerConnection.cleanup()
        setPeerConnection(undefined)
    }

    const getCarControl = useCallback(() => {
        socket &&
        socket.send(JSON.stringify({
            action: wsConst.outMessages.get_car_control,
            car_id: wsConst.car_id,
            pilot_id: wsConst.pilot_id
        }))
    }, [socket])


    const onConnectClick = () => {
        connectSocket(onMessage)
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
