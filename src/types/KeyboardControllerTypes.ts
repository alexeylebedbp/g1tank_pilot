export const moveEvents = ["up", "down", "left", "right"] as const
export const keyboardArrowEvents = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"] as const
export type MoveEvent = typeof moveEvents[number]
export type KeyboardArrowEvent = typeof keyboardArrowEvents[number]