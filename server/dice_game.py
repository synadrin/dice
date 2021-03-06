import copy
from itertools import repeat
import logging
from operator import itemgetter
import random


SCORE_WIN = 10000
SCORE_ON_THE_BOARD = 650
SCORE_TO_PASS = 1000
MINIMUM_PLAYERS = 2
DICE_NUMBER = 5
DICE_MIN_VALUE = 1
DICE_MAX_VALUE = 6
ONE_VALUE = 100
FIVE_VALUE = 50


class InsufficientPlayersError(Exception):
    pass


class GameOverError(Exception):
    pass


class CantStopError(Exception):
    pass


class DiceGame:
    def __init__(self, player_names):
        num_players = len(player_names)
        if not isinstance(player_names, list):
            raise TypeError
        if num_players < MINIMUM_PLAYERS:
            raise InsufficientPlayersError(len(player_names))

        random.seed()

        random.shuffle(player_names)
        self.players = [{"name": name, "score": 0, "place": 1} \
            for name in player_names]

        self.current_turn = 0
        self.current_round = 1
        self.previous_turn_name = ""
        self.previous_turn_result = ""
        self.score_win = SCORE_WIN
        self.score_on_the_board = SCORE_ON_THE_BOARD
        self.score_to_pass = SCORE_TO_PASS
        self.game_over = False
        self.winner = None
        self.ended = False
        self.ended_by = None

        self.max_dice = DICE_NUMBER
        self.dice = [{"value": num, "locked": False, "counted": True} \
            for num in range(1, DICE_NUMBER + 1)]
        self.current_score = 0
        self.available_dice = DICE_NUMBER
        self.game_log = []
        self.total_roll_count = 0
        self.last_roll_score = -1
        self.can_stop = False

        self.last_action = {
            "type": "",
            "result": "",
            "dice": [],
            "player_name": "",
            "score": 0,
        }

    def get_current_turn_name(self):
        return self.players[self.current_turn]["name"]

    def get_state(self):
        current_turn_name = self.get_current_turn_name()
        return {
            "game_over": self.game_over,
            "ended": self.ended,
            "ended_by": self.ended_by,
            "players": self.players,
            "current_turn": self.current_turn,
            "current_turn_name": current_turn_name,
            "current_round": self.current_round,
            "previous_turn_name": self.previous_turn_name,
            "previous_turn_result": self.previous_turn_result,
            "total_roll_count": self.total_roll_count,
            "score_win": self.score_win,
            "score_on_the_board": self.score_on_the_board,
            "score_to_pass": self.score_to_pass,
            "max_dice": self.max_dice,
            "available_dice": self.available_dice,
            "last_roll_score": self.last_roll_score,
            "last_action": self.last_action,
            "game_log": self.game_log,
            "can_stop": self.can_stop,
            "dice": self.dice,
            "current_score": self.current_score,
            "winner": self.winner,
        }

    def update_players_places(self):
        sorted_players = sorted(
            [(i, p["score"]) for i, p in enumerate(self.players)],
            key=itemgetter(1), reverse=True)
        place = 1
        last_score = 0
        for index, score in sorted_players:
            if score < last_score:
                place += 1
            self.players[index]["place"] = place
            last_score = score

    def next_player(self):
        self.previous_turn_name = self.get_current_turn_name()
        self.current_turn += 1
        if self.current_turn >= len(self.players):
            self.current_turn = 0
            self.current_round += 1
        self.can_stop = False
        logging.debug("player: {}".format(self.get_current_turn_name()))

    def reset_dice(self):
        logging.debug("reset_dice")
        self.available_dice = self.max_dice
        for die in self.dice:
            die["locked"] = False
            die["counted"] = False

    def new_turn(self):
        self.current_score = 0
        self.reset_dice()
        self.next_player()

    def bust(self):
        logging.debug("bust")
        self.last_action["result"] = "bust"
        self.previous_turn_result = "busted"
        self.game_log.append(copy.deepcopy(self.last_action))
        self.new_turn()

    def win(self):
        self.winner = self.get_current_turn_name()
        self.players[self.current_turn]["score"] = self.score_win
        self.update_players_places()
        self.last_action["result"] = "win"
        self.game_over = True
        self.can_stop = False
        self.game_log.append(copy.deepcopy(self.last_action))
        logging.debug("winner: {}".format(self.winner))

    def end_game(self):
        if self.game_over:
            raise GameOverError

        self.last_action["type"] = "end"
        self.last_action["result"] = "game_over"
        self.last_action["player_name"] = self.get_current_turn_name()
        self.last_action["score"] = 0

        self.ended_by = self.get_current_turn_name()
        self.game_over = True
        self.ended = True
        self.can_stop = False
        self.game_log.append(copy.deepcopy(self.last_action))
        logging.debug("ended: {}".format(self.ended_by))

    def roll(self):
        if self.game_over:
            raise GameOverError

        self.last_action["type"] = "roll"
        self.last_action["player_name"] = self.get_current_turn_name()
        self.last_action["dice"] = []

        # Roll available dice
        for die in self.dice:
            if not die["locked"]:
                die["value"] = random.randint(DICE_MIN_VALUE, DICE_MAX_VALUE)
                self.last_action["dice"].append(die["value"])
            die["counted"] = False
        self.total_roll_count += 1

        # Calculate score
        self.last_roll_score = 0
        ## 3 of a kind
        if self.available_dice >= 3:
            # TODO: This should be less hard-coded
            for value in range(DICE_MIN_VALUE, DICE_MAX_VALUE + 1):
                found = []
                for die in self.dice:
                    if not die["locked"] and not die["counted"] \
                            and die["value"] == value:
                        found.append(die)
                        if len(found) == 3:
                            if value == 1:
                                self.last_roll_score += 1000
                            else:
                                self.last_roll_score += value * 100
                            for d in found:
                                d["counted"] = True
                                d["locked"] = True
                                self.available_dice -= 1
                            found = []

        ## 1s and 5s
        first_five_found = False
        for die in self.dice:
            if not die["locked"] and not die["counted"]:
                if die["value"] == 1:
                    self.last_roll_score += ONE_VALUE
                    die["counted"] = True
                    die["locked"] = True
                    self.available_dice -= 1
                elif die["value"] == 5:
                    self.last_roll_score += FIVE_VALUE
                    die["counted"] = True
                    # This is the second five, only the first one is locked
                    if first_five_found:
                        first_five_found = False
                    else:
                        die["locked"] = True
                        self.available_dice -= 1
                        first_five_found = True

        #logging.debug("roll: {} / score: {}".format(self.dice, self.last_roll_score))
        self.current_score += self.last_roll_score
        self.last_action["score"] = self.last_roll_score
        player_new_score = self.players[self.current_turn]["score"] \
            + self.current_score
        if self.last_roll_score == 0:
            # Bust if nothing scored this roll
            self.bust()
        elif player_new_score > self.score_win:
            # Bust if the roll would put player over the winning total
            self.bust()
        elif player_new_score == self.score_win:
            # Win if the player hits the target score exactly
            self.win()
        else:
            self.last_action["result"] = "score"

            if self.available_dice == 0:
                # Player has control of the dice, reset to full amount for next roll
                self.reset_dice()
                self.last_action["result"] = "control"

            if player_new_score >= self.score_on_the_board:
                # Player can only stop rolling if they hit a minimum overall score
                self.can_stop = True

            self.game_log.append(copy.deepcopy(self.last_action))

    def stop_roll(self):
        if not self.can_stop:
            raise CantStopError

        logging.debug("stop_roll")

        self.last_action["type"] = "stop_roll"
        self.last_action["result"] = "+{}".format(self.current_score)
        self.last_action["player_name"] = self.get_current_turn_name()
        self.previous_turn_result = "+{}".format(self.current_score)

        self.game_log.append(copy.deepcopy(self.last_action))

        self.players[self.current_turn]["score"] += self.current_score
        self.update_players_places()
        if self.current_score >= self.score_to_pass:
            self.next_player()
        else:
            self.new_turn()
