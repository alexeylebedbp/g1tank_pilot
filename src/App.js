import logo from './logo.svg';
import './App.css';
import {useEffect, useState, useCallback} from "react"
import {Canvas} from "./Canvas"
import {MoveCommandButton} from "./MoveCommandButton"
import {useSocket} from "./Websocket"
import {wsConst} from "./credentials"

function App(props) {

    let {intervals: {leftBtnStateReporter, rightBtnStateReporter, upBtnStateReporter, downBtnStateReporter}} = props
    const {connectSocket, socket, socketConnected} = useSocket()
    const [carConnected, setCarConnected] = useState(false)

    const onMessage = (message) => {
        if (message.action === wsConst.inMessages.car_control_obtained) {
            setCarConnected(true)
        } else if (message.action === "close") {
            setCarConnected(false)
        }
    }

    useEffect(() => {
        socket && document.addEventListener("keydown", handleKeyboardDown, false);
        socket && document.addEventListener("keyup", handleKeyboardUp, false);
    }, [socket])

    useEffect(() => {
        return () => {
            document.removeEventListener("keydown", handleKeyboardDown, false);
            document.removeEventListener("keyup", handleKeyboardUp, false);
        }
    }, [])


    const mapEvent = (eventCode) => {
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

    const mapCommandToDirection = (command) => {
        if (command === "left" || command === "right") return command
        if (command === "up") return "forward"
        if (command === "down") return "backward"
    }

    const intervalFactory = (command) => {
        return setInterval(() => {
            if (socket) {
                console.log("Sending ws")
                socket.send(JSON.stringify({
                    action: wsConst.outMessages.move,
                    direction: mapCommandToDirection(command),
                    pilot_id: wsConst.pilot_id
                }))
            }
        }, 200)
    }

    const send = (command) => {
        if (command === "left") {
            if (!leftBtnStateReporter && socket) {
                leftBtnStateReporter = intervalFactory(command)
            }
        } else if (command === "right") {
            if (!rightBtnStateReporter && socket) {
                rightBtnStateReporter = intervalFactory(command)
            }
        } else if (command === "up") {
            if (!upBtnStateReporter && socket) {
                upBtnStateReporter = intervalFactory(command)
            }

        } else if (command === "down") {
            if (!downBtnStateReporter && socket) {
                downBtnStateReporter = intervalFactory(command)
            }

        }
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
    }

    const ioUp = (e) => {
        if (!e) return
        if (e.target.id === "left") {
            leftBtnStateReporter && clearInterval(leftBtnStateReporter)
            leftBtnStateReporter = undefined
        } else if (e.target.id === "right") {
            rightBtnStateReporter && clearInterval(rightBtnStateReporter)
            rightBtnStateReporter = undefined
        } else if (e.target.id === "up") {
            upBtnStateReporter && clearInterval(upBtnStateReporter)
            upBtnStateReporter = undefined
        } else if (e.target.id === "down") {
            downBtnStateReporter && clearInterval(downBtnStateReporter)
            downBtnStateReporter = undefined
        }
    }

    const ioDown = (e) => {
        if (!e) return
        if (e.target.id === "left") {
            send("left", socket)
        } else if (e.target.id === "right") {
            send("right", socket)
        } else if (e.target.id === "up") {
            send("up", socket)
        } else if (e.target.id === "down", socket) {
            send("down", socket)
        }
    }

    const handleMouseUp = (e) => {
        // console.log("Mouse Up")
        ioUp(e)
    }

    const handleMouseDown = (e) => {
        // console.log("Mouse Down")
        ioDown(e)

    }

    const handleKeyboardDown = (event) => {
        // console.log("KeyDown:", event.code)
        ioDown(mapEvent(event.code))
    };


    const handleKeyboardUp = (event) => {
        // console.log("KeyUp:", event.code)
        ioUp(mapEvent(event.code))
    };

    const handleClick = (e) => {
        if (!e.target) return
        let interval = setInterval(() => {
            if (socket) {
                console.log("Sending ws")
                socket.send(JSON.stringify({
                    action: wsConst.outMessages.move,
                    direction: mapCommandToDirection(e.target.id),
                    pilot_id: wsConst.pilot_id
                }))
            }
        }, 200)
        setTimeout(() => {
            clearInterval(interval)
        }, 500)
    }

    return (
        <div className="App">
            <header className="App-header">
                <Canvas/>
                <p>G1 Tank Pilot</p>
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
                        <MoveCommandButton name={"up"} handleMouseDown={handleMouseDown} handleMouseUp={handleMouseUp}
                                           handleClick={handleClick}/>
                    </div>
                    <div className={"Control-buttons-line"}>
                        <MoveCommandButton name={"left"} handleMouseDown={handleMouseDown} handleMouseUp={handleMouseUp}
                                           handleClick={handleClick}/>
                        <MoveCommandButton name={"down"} handleMouseDown={handleMouseDown} handleMouseUp={handleMouseUp}
                                           handleClick={handleClick}/>
                        <MoveCommandButton name={"right"} handleMouseDown={handleMouseDown}
                                           handleMouseUp={handleMouseUp} handleClick={handleClick}/>
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;
