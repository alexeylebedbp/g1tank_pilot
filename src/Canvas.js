import React from 'react'
import {useEffect} from "react"

export function Canvas(){
    useEffect(() => {
        let c = document.getElementById("myCanvas")
        let context = c.getContext("2d")
        var radian = Math.PI / 180;

        // context.beginPath();
        // context.strokeStyle = "red";
        // context.lineWidth = 5;
        // context.moveTo(430, 130);
        // context.bezierCurveTo(470,10,670,10,670,180);
        // context.quadraticCurveTo(670, 380, 430, 520);
        // context.quadraticCurveTo(190, 380, 190, 180);
        // context.bezierCurveTo(190, 10, 400, 10, 430, 130);
        // context.stroke();

        // context.beginPath()
        // context.lineCap = "butt"
        // context.strokeStyle = "red"
        // context.lineWidth = 10
        // context.moveTo(100,100)
        // context.lineTo(300,100)
        // context.stroke()
        //
        // context.beginPath()
        // context.lineCap = "round"
        // context.strokeStyle = "blue"
        // context.lineWidth = 10
        // context.moveTo(100,125)
        // context.lineTo(300,125)
        // context.stroke()
        //
        // context.beginPath()
        // context.lineCap = "square"
        // context.strokeStyle = "green"
        // context.lineWidth = 10
        // context.moveTo(100,150)
        // context.lineTo(300,150)
        // context.stroke()
        //
        // context.beginPath();
        // context.strokeStyle = "blue";
        // context.lineWidth = 10;
        // context.arc(100, 100, 50, 0 * radian, 180 * radian, false);
        // context.stroke();
    }, [])


    return(
        <canvas
            id="myCanvas"
            width="600"
            height="400"
            className={"Canvas"}
        />
    )
}