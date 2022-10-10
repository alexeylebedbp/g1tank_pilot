import React, {useEffect, useState} from "react"

export function MoveCommandButton(props){
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