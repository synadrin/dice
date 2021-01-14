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


""" Raised if the room_code is invalid """
class InvalidRoomCodeError(Exception):
    pass


""" Raised if the member name is invalid """
class InvalidNameError(Exception):
    pass


""" Raised if a second member tries to use a duplicate name
(i.e. it's already in use """
class NameInUseError(Exception):
    pass


""" Raised if a player tries to act on another player's turn """
class WrongPlayerError(Exception):
    pass


""" Raised if an attempt is made at starting a game when one is already active """
class GameAlreadyRunning(Exception):
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
        game_state = None
        if self.is_game_active:
            game_state = self.current_game.get_state()
        can_start = len(self.members) >= dice_game.MINIMUM_PLAYERS \
            and not self.is_game_active

        return {
            "type": "room",
            "room_code": self.room_code,
            "members": list(self.members.keys()),
            "can_start": can_start,
            "is_game_active": self.is_game_active,
            "current_game": game_state,
            "game_history": self.game_history,
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
        if self.is_game_active:
            raise GameAlreadyRunning

        if self.current_game:
            self.game_history.append(self.current_game)

        self.current_game = dice_game.DiceGame(list(self.members))
        self.is_game_active = True

    def end_current_game(self):
        pass

    def roll(self, name):
        # TODO: Roll
        self.is_game_active = not self.current_game.game_over
