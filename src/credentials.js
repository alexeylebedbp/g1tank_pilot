export const wsConst = {
    address: "ws://10.0.0.250:8081",
    pilot_id: "811BF759-11DE-4729-83B2-3408B80208C5",
    car_id: "811BF759-11DE-4729-83B2-3408B80208C5",
    frequency: 10, //Hz
    outMessages: {
        auth_session: "auth_session",
        get_car_control: "get_car_control",
        pong: "__pong__",
        move: "move"
    },
    inMessages: {
        ping: "__ping__",
        red: "red",
        car_control_obtained: "car_control_obtained"
    }
}