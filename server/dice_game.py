TARGET_SCORE = 10000
ON_THE_BOARD_SCORE = 650
NUMBER_OF_DICE = 5
MINIMUM_PLAYERS = 3


class Player:
    def __init__(self, name):
        self.name = name
        self.score = 0


class DiceGame:
    def __init__(self, now):
        self.scores = {}
        self.turn_order = []
        self.dice = []
        self.max_dice = NUMBER_OF_DICE
        self.start_time = now
        self.end_time = None
