import React from "react";

export interface MoveCommandButtonProps {
    name: string
    handleMouseDown: React.MouseEventHandler<HTMLDivElement> | undefined
    handleMouseUp: React.MouseEventHandler<HTMLDivElement> | undefined
    handleClick: React.MouseEventHandler<HTMLDivElement> | undefined
}