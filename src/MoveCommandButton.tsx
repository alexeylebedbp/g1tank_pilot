import React from "react"
import {MoveCommandButtonProps} from "./types/MoveCommandButtonProps";

export const MoveCommandButton: React.FC<MoveCommandButtonProps> = (props) =>{
    const {name, handleMouseDown, handleMouseUp, handleClick} = props
    return(
        <div
            id={name}
            className={"Control-button"}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
        >
            {name}
        </div>
    )
}