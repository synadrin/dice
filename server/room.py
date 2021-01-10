import dice_game


MIN_ROOM_CODE_LENGTH = 4
MAX_ROOM_CODE_LENGTH = 8
MIN_NAME_LENGTH = 1


"""TODO"""
def generateRoomCode():
    return "roomcode"


def isValidRoomCode(code):
    return code.isalnum() and len(code) >= MIN_ROOM_CODE_LENGTH \
        and len(code) <= MAX_ROOM_CODE_LENGTH


def isValidName(name):
    return len(name) >= MIN_NAME_LENGTH


class InvalidRoomCodeError(Exception):
    pass


class InvalidNameError(Exception):
    pass


class NameInUseError(Exception):
    pass


class Room:
    def __init__(self, code):
        if not isValidRoomCode(code):
            raise InvalidRoomCodeError(code)
        self.room_code = code
        self.members = {}
        self.game_history = []
        self.current_game = None
        self.is_game_active = False

    def get_state(self):
        return {
            "room_code": self.room_code,
            "members": list(self.members.keys()),
        }

    def join(self, name, websocket):
        if not isValidName(name):
            raise InvalidNameError(name)
        if name in self.members:
            raise NameInUseError(name)

        self.members[name] = websocket

    def leave(self, name):
        try:
            del self.members[name]
        except KeyError:
            pass

    def start_new_game(self):
        pass

    def end_current_game(self):
        pass
