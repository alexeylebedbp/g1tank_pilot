import {wsConst} from "./credentials";
import {MoveEvent, KeyboardArrowEvent} from "./types/KeyboardControllerTypes";

export class KeyboardController {
    ws: WebSocket
    leftBtnStateReporter: NodeJS.Timer | undefined = undefined
    rightBtnStateReporter: NodeJS.Timer | undefined = undefined
    upBtnStateReporter: NodeJS.Timer | undefined = undefined
    downBtnStateReporter: NodeJS.Timer | undefined = undefined

    constructor(ws: WebSocket) {
        this.ws = ws
        this.leftBtnStateReporter = undefined
        this.rightBtnStateReporter = undefined
        this.upBtnStateReporter = undefined
        this.downBtnStateReporter =  undefined
    }

    handleMouseUp: React.MouseEventHandler<HTMLDivElement> = (e) => {
        this._onUp(e)
    }

    handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
        this._onDown(e)
    }

    handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (!e.target) return
        const target: any = e.target
        this.ws.send(JSON.stringify({
            action: wsConst.outMessages.move,
            direction: this._mapCommandToDirection(target.id),
            pilot_id: wsConst.pilot_id
        }))
    }

    handleKeyboardUp = (event: KeyboardEvent) => {
        this._onUp(this._mapEvent(event.code as KeyboardArrowEvent))
    };

    handleKeyboardDown = (event: KeyboardEvent) => {
        this._onDown(this._mapEvent(event.code as KeyboardArrowEvent))
    };

    _mapCommandToDirection = (command: MoveEvent) => {
        if (command === "left" || command === "right") return command
        if (command === "up") return "forward"
        if (command === "down") return "backward"
    }

    _mapEvent = (eventCode: KeyboardArrowEvent): {target: {id: MoveEvent}} | null => {
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

    _intervalFactory = (command: MoveEvent) => {
        return setInterval(() => {
            if (this.ws) {
                console.log("Sending move command:", command)
                this.ws.send(JSON.stringify({
                    action: wsConst.outMessages.move,
                    direction: this._mapCommandToDirection(command),
                    pilot_id: wsConst.pilot_id
                }))
            }
        }, 1000/wsConst.frequency)
    }

    _send = (command: MoveEvent) => {
        if (command === "left") {
            if (!this.leftBtnStateReporter && this.ws) {
                this.leftBtnStateReporter = this._intervalFactory(command)
            }
        } else if (command === "right") {
            if (!this.rightBtnStateReporter && this.ws) {
                this.rightBtnStateReporter = this._intervalFactory(command)
            }
        } else if (command === "up") {
            if (!this.upBtnStateReporter && this.ws) {
                this.upBtnStateReporter = this._intervalFactory(command)
            }
        } else if (command === "down") {
            if (!this.downBtnStateReporter && this.ws) {
                this.downBtnStateReporter = this._intervalFactory(command)
            }
        }
    }

    _onUp = (e: React.MouseEvent<HTMLDivElement> | {target: {id: MoveEvent}} | null) => {
        if (!e || e.target) return
        const target: any = e.target
        if (target.id === "left") {
            this.leftBtnStateReporter && clearInterval(this.leftBtnStateReporter)
            this.leftBtnStateReporter = undefined
        } else if (target.id === "right") {
            this.rightBtnStateReporter && clearInterval(this.rightBtnStateReporter)
            this.rightBtnStateReporter = undefined
        } else if (target.id === "up") {
            this.upBtnStateReporter && clearInterval(this.upBtnStateReporter)
            this.upBtnStateReporter = undefined
        } else if (target.id === "down") {
            this.downBtnStateReporter && clearInterval(this.downBtnStateReporter)
            this.downBtnStateReporter = undefined
        }
    }

    _onDown = (e: React.MouseEvent<HTMLDivElement> | {target: {id: MoveEvent}} | null) => {
        if (!e || !e.target) return
        const target: any = e.target
        if (target.id === "left") {
            this._send("left")
        } else if (target.id === "right") {
            this._send("right")
        } else if (target.id === "up") {
            this._send("up")
        } else if (target.id === "down") {
            this._send("down")
        }
    }
}