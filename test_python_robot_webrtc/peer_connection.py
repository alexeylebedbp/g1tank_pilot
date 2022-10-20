import platform
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay
from aiortc.rtcrtpsender import RTCRtpSender
# from pyaudio import pyaudio

class WebrtcState:
    def __init__(self, transport):
        self.relay = None
        self.cam = None
        self.microphone = None
        self.transport = transport
        self.peer_connection = None

    def create_local_tracks(self):
        options = {"framerate": "30", "video_size": "640x480"}
        if self.relay is None:
            if platform.system() == "Darwin":
                self.cam = MediaPlayer("default", format="avfoundation", options=options)
                # self.microphone = MediaPlayer("default", format="pulse")
            elif platform.system() == "Windows":
                self.cam = MediaPlayer(
                    "video=Integrated Camera", format="dshow", options=options
                )
            else:
                self.cam = MediaPlayer("/dev/video0", format="v4l2", options=options)

            self.relay = MediaRelay()
            print(34, self.cam.video)
        return None, self.relay.subscribe(self.cam.video)

    async def create_offer(self):
        print("create_offer 30")
        self.peer_connection = RTCPeerConnection()

        @self.peer_connection.on("connectionstatechange")
        async def on_connectionstatechange():
            print("Connection state is %s" % self.peer_connection.connectionState)
            if self.peer_connection.connectionState == "failed":
                await self.peer_connection.close()

        audio, video = self.create_local_tracks()
        if audio:
            self.peer_connection.addTrack(audio)
        if video:
            self.peer_connection.addTrack(video)

        offer = await self.peer_connection.createOffer()
        await self.peer_connection.setLocalDescription(offer)

        return {
            "action": "webrtc_offer",
            "sdp": self.peer_connection.localDescription.sdp,
            "type": self.peer_connection.localDescription.type
        }

    async def on_answer(self, remoteSDP):
        answer = RTCSessionDescription(sdp=remoteSDP, type="answer")
        await self.peer_connection.setRemoteDescription(answer)