import logo from './logo.svg';
import './App.css';
import {useEffect, useState, useRef, useCallback} from "react"
import {useSocket} from "./Websocket"
import {createWebRtcPeerConnection} from "./PeerConnectionRobot"


function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function App() {
  const [peerConnection, setPeerConnection] = useState(undefined)
  const prevPeerConnection = usePrevious(peerConnection);
  const {connectSocket, socket, socketConnected} = useSocket()

  let onMessage = (message, transport) => {
    if(message.action === "offer_request"){
      const _peerConnection = createWebRtcPeerConnection(transport)
      transport.peerConnection = _peerConnection
      setPeerConnection(_peerConnection)
    } else if(message.action === "webrtc_answer"){
      transport.peerConnection.onAnswer(message.sdp)
    } else if(message.action === "answer_ice"){
      transport.peerConnection.onRemoteIceCandidate(message)
    }
  }

  useEffect(() => {
    connectSocket(onMessage)
        .catch((e)=>{
          console.log("Couldn't establish websocket connection. No response from the server.", e)
        })
  }, [])

  useEffect(()=> {
    if(peerConnection && !prevPeerConnection){
      peerConnection.makeCall().then(localSDP => {
        socket.send(JSON.stringify({
          action: "webrtc_offer",
          sdp: localSDP
        }))
      })
    }
  }, [peerConnection])

  return (
    <div className="App">
      <header className="App-header"  id="app">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
