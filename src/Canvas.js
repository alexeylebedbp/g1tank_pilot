import React from 'react';
import {useEffect} from "react"

export function Canvas(){
    useEffect(() => {
        let c = document.getElementById("myCanvas");
        let ctx = c.getContext("2d");
        ctx.moveTo(0, 0);
        ctx.lineTo(200, 100);
        ctx.stroke();

        ctx.fillStyle = "blue";
        ctx.fillRect(10,40,30,70);

        ctx.fillStyle = "yellow";
        ctx.fillRect(50,30,60,30);
    }, [])

    return(
        <canvas
            id="myCanvas"
            width="400"
            height="200"
            className={"Canvas"}
        />
    )
}