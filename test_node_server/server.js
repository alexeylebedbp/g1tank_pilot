const ws =  require('ws')
const WebSocketServer = ws.WebSocketServer
const port = 8000

const socket = new WebSocketServer({port})
console.log("Server is running, port", socket.address())
const peers = {
    offer: undefined,
    answer: undefined
}

socket.on('connection', function connection(ws) {
    ws.on('message', function message(data) {
        const parsed = JSON.parse(data)
        console.log("Received", parsed.action)
        if(parsed.action === "webrtc_can_answer"){
            console.log("Setting Answer Peer")
            peers.answer = ws
            if(peers.offer){
                peers.offer.send(JSON.stringify({action: "offer_request"}))
            }
        } else if (parsed.action === "webrtc_can_offer"){
            console.log("Setting Offer Peer")
            peers.offer = ws
        } else if(parsed.action === "webrtc_offer"){
            peers.answer &&
            peers.answer.send(JSON.stringify({action: "webrtc_offer", sdp: parsed.sdp}))
        } else if(parsed.action === "answer_ice"){
            peers.offer &&
            peers.offer.send(JSON.stringify({action: "answer_ice", candidate: parsed.candidate}))
        } else if(parsed.action === "webrtc_answer"){
            peers.offer.send(JSON.stringify({action: "webrtc_answer", sdp: parsed.sdp}))
        } else if(parsed.action === "offer_ice"){
            peers.answer &&
            peers.answer.send(JSON.stringify({action: "offer_ice", candidate: parsed.candidate}))
        }
    });

    ws.send(JSON.stringify({action: "connected"}));
});


// app.get('/webrtc_can_offer', (req, res) => {
//     peers.offer = res
// })
//
// app.post('/webrtc_offer', (req, res) => {
//     peers.offer.sdp = req.body.sdp
//     peers.offer.peer = res
//     if(peers.answer){
//         peers.answer.send(JSON.stringify({offer: peers.offer.sdp}))
//     }
// })
//
// app.get('/webrtc_can_answer', (req, res) => {
//     peers.answer = res
//     peers.offer &&
//     peers.offer.send(JSON.stringify({action: "peer_found"}))
// })
//
// app.post('/webrtc_answer', (req, res) => {
//     console.log("answer", req)
//     peers.offer.peer.send(JSON.stringify(req.body))
// })
//
// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
// })

