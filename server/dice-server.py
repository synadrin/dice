#!/usr/bin/python3 -u

import asyncio
import os
import websockets


async def echo(websocket, path):
    print(path)
    async for message in websocket:
        print(message)
        await websocket.send(message)


if __name__ == "__main__":
    PORT = int(os.getenv("WEBSOCKET_PORT", 8765))
    HOST = os.getenv("WEBSOCKET_HOSTNAME", "localhost")
    USE_TLS = os.getenv("WEBSOCKET_USE_TLS", "no")
    CERT_FILE = os.getenv("WEBSOCKET_CERT_FILE", "")

    start_server = websockets.serve(echo, HOST, PORT)

    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
