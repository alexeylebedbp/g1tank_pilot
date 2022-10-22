import React from 'react'

export function sendStreamToCanvas(stream: MediaStream): HTMLVideoElement {
    const videoElement = document.createElement('video')
    const _canvas = document.getElementById("myCanvas") as HTMLCanvasElement
    videoElement.autoplay = true
    videoElement.srcObject = stream
    videoElement.height = _canvas.height
    videoElement.width = _canvas.width
    videoElement.addEventListener('play', function() {
        let $this = this;
        (function loop() {
            if (_canvas) {
                const ctx = _canvas.getContext("2d") as CanvasRenderingContext2D
                ctx.save();
                ctx.rotate(180 * Math.PI/180);
                ctx.drawImage($this, -_canvas.width, -_canvas.height, _canvas.width, _canvas.height);
                ctx.restore();
                setTimeout(loop, 1000 / 30); // drawing at 30fps
            }
        })();
    });
    return videoElement
}

export const Canvas: React.FC = () => {
    return(
        <canvas
            id="myCanvas"
            width="600"
            height="450"
            className={"Canvas"}
        />
    )
}