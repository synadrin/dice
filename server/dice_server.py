import asyncio
import json
import logging
import os
import room
import websockets


class DiceServer:
    def __init__(self, hostname, port, use_tls, cert_file):
        self.hostname = hostname
        self.port = port
        self.use_tls = use_tls
        self.cert_file = cert_file
        self.ws_server = None

        self.rooms = {}

    async def register_connection(self, websocket, data):
        room_code = data["room_code"].lower()

        # Raises room.InvalidRoomCodeError
        if not room_code in self.rooms:
            self.rooms[room_code] = room.Room(room_code)

        # Raises room.InvalidNameError
        self.rooms[room_code].join(data["name"], websocket)

        logging.info("Connected: {}/{}".format(room_code, data["name"]))
        await self.notify_room(room_code)
        
        return room_code, data["name"]

    async def unregister_connection(self, room_code, name):
        if room_code in self.rooms:
            self.rooms[room_code].leave(name)
            logging.info("Disconnected: {}/{}".format(room_code, name))
            await self.notify_room(room_code)

    async def notify_room(self, room_code):
        if room_code in self.rooms:
            room_state = json.dumps(self.rooms[room_code].get_state())
            if self.rooms[room_code].members:
                members = self.rooms[room_code].members
                await asyncio.wait(
                    [members[name].send(room_state) for name in members]
                )

    async def consumer_handler(self, websocket, path):
        room_code = ""
        name = ""
        async for message in websocket:
            # Decode JSON
            try:
                data = json.loads(message)
                if data["action"] == "join":
                    (room_code, name) = await self.register_connection(
                        websocket, data
                    )
                elif data["action"] == "start_game":
                    pass
                elif data["action"] == "roll":
                    pass
                elif data["action"] == "stop_roll":
                    pass
                else:
                    logging.error("Unsupported event: {}".format(data))
            except json.JSONDecodeError:
                logging.error("Invalid JSON: {}".format(message))
                await websocket.send(json.dumps({"error_msg": "Invalid JSON."}))
            except room.InvalidRoomCodeError as e:
                # TODO: Return error message
                error_msg = "InvalidRoomCodeError: ".format(e)
                logging.debug(error_msg)
                await websocket.send(json.dumps({"error_msg": error_msg}))
            except room.InvalidNameError as e:
                error_msg = "InvalidNameError: ".format(e)
                logging.debug(error_msg)
                await websocket.send(json.dumps({"error_msg": error_msg}))
            except room.NameInUseError as e:
                error_msg = "NameInUseError: ".format(e)
                logging.debug(error_msg)
                await websocket.send(json.dumps({"error_msg": error_msg}))
            except (AttributeError, ValueError) as e:
                error_msg = "Problem with request"
                logging.error("Problem with request: {}: {}".format(data, e))
                await websocket.send(json.dumps({"error_msg": error_msg}))
            except (ConnectionClosed, ConnectionClosedError, ConnectionClosedOK) as e:
                logging.debug("Connection closed: {}".format(e))
                await self.unregister_connection(room_code, name)
            finally:
                #await self.unregister_connection(room_code, name)
                pass

    def start(self):
        self.ws_server = websockets.serve(self.consumer_handler,
                self.hostname, self.port)

        asyncio.get_event_loop().run_until_complete(self.ws_server)
        asyncio.get_event_loop().run_forever()


if __name__ == "__main__":
    PORT = int(os.getenv("WEBSOCKET_PORT", 8765))
    HOST = os.getenv("WEBSOCKET_HOSTNAME", "localhost")
    USE_TLS_TEXT = os.getenv("WEBSOCKET_USE_TLS", "no")
    USE_TLS = (USE_TLS_TEXT == "yes")
    CERT_FILE = os.getenv("WEBSOCKET_CERT_FILE", "")
    DEBUG = os.getenv("DEBUG", False)

    logLevel = logging.INFO
    if DEBUG:
        logLevel = logging.DEBUG
    logging.basicConfig(format="[%(asctime)s] %(message)s", level=logLevel)

    ds = DiceServer(HOST, PORT, USE_TLS, CERT_FILE)
    ds.start()
