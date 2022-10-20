import asyncio

from transport import Transport, TransportEventSubscriber
from peer_connection import WebrtcState

class Car(TransportEventSubscriber):
    def __init__(self):
        super().__init__()
        self.transport = Transport(
            car=self,
            host="http://localhost:8000",
            car_id=None,
            initialTimeout=5,
            maxTimeout=20
        )
        self.webrtcState = None
        self.loop = asyncio.get_event_loop()

    def run(self):
        self.loop.run_until_complete(self.transport.connect())

    async def on_offer_request(self):
        self.webrtcState = WebrtcState(self.transport)
        webrtc_offer = await self.webrtcState.create_offer()
        self.transport.send(webrtc_offer)

    async def on_answer(self, sdp):
        await self.webrtcState.on_answer(sdp)

    def on_remote_ice(self):
        pass


car = Car()
car.run()

