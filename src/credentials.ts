export const constants = {
    address: "ws://10.0.0.250:8081",
    addressTest: "ws://localhost:8000",
    pilot_id: "811BF759-11DE-4729-83B2-3408B80208C5",
    car_id: "811BF759-11DE-4729-83B2-3408B80208C5",
    frequency: 10, //Hz
    outMessages: {
        auth_session: "auth_session",
        get_car_control: "get_car_control",
        webrtc_can_answer: "webrtc_can_answer",
        pong: "__pong__",
        move: "move",
        webrtc_answer: "webrtc_answer",
        answer_ice: "answer_ice",
        offer_request: "offer_request",
        byebye: "byebye"
    },
    inMessages: {
        ping: "__ping__",
        poor_network: "poor_network_detected",
        car_control_obtained: "car_control_obtained",
        failed_to_obtain_car_control: "failed_to_obtain_car_control",
        car_disconnected: "car_disconnected",
        close: "close",
        webrtc_offer: "webrtc_offer",
        offer_ice: "offer_ice"
    }
}