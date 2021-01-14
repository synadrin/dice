var dg = undefined;

function DiceGame()
{
	var that = this;

	this.websocket = undefined;
	this.name = "";
	this.room_code = "";

	this.can_start = false;
	this.can_roll = false;
	this.can_stop = false;

	this.controls = {
		start_btn: document.getElementById("start_btn"),
		roll_btn: document.getElementById("roll_btn"),
		stop_roll_btn: document.getElementById("stop_roll_btn"),
	};
	this.controls.start_btn.disabled = true;
	this.controls.roll_btn.disabled = true;
	this.controls.stop_roll_btn.disabled = true;

	if ("WebSocket" in window)
	{
		this.websocket = new WebSocket(WS_URL);

		this.websocket.onopen = function()
		{
		}

		this.websocket.onmessage = function(evt)
		{
			that.parse_message(evt.data);
		}

		this.websocket.onclose = function()
		{
			// TODO: Cleanup?
			// Switch back to join screen
		}
	}

	this.parse_message = function(message)
	{
		// TODO: Handle parsing problems/validation
		data = JSON.parse(message);

		if (data.type == "error")
		{
			that.show_error_msg(data.msg);
		} else
		{
			// Switch to game display
			var sign_in = document.getElementById("signin");
			sign_in.style = "display: none;"
			var game_room = document.getElementById("game_room");
			game_room.style = "display: initial;"

			// Parse state
			if ("is_game_active" in data && data.is_game_active)
			{
				that.can_start = false;

				// Is the game over?
				if ("game_over" in data.current_game && data.current_game.game_over)
				{
					console.log("Game Over");
					//TODO: Game Over screen
				// Is it our turn?
				} else if ("current_turn_name" in data.current_game
					&& data.current_game.current_turn_name == that.name)
				{
					that.can_roll = true;
					that.can_stop = ("can_stop" in data.current_game
						&& data.current_game.can_stop);
				}
			} else
			{
				that.can_start = ("can_start" in data && data.can_start);
			}

			// Update button states
			that.controls.start_btn.disabled = !that.can_start;
			that.controls.roll_btn.disabled = !that.can_roll;
			that.controls.stop_roll_btn.disabled = !that.can_stop;

			var p = document.createElement("p");
			p.textContent = message;
			game_room.appendChild(p);
		}
	}

	this.send = function(command)
	{
		return that.websocket.send(JSON.stringify(command));
	}

	this.show_error_msg = function(error_msg)
	{
		// TODO: Display at top of the screen
		console.log(error_msg);
	}

	this.join = function(name, room_code)
	{
		that.name = name;
		that.room_code = room_code;
		var command = {
			action: "join",
			name: name,
			room_code: room_code,
		}

		that.send(command);
	}

	this.start_game = function()
	{
		var command = {
			action: "start_game"
		}
		that.send(command);
	}

	this.roll = function()
	{
		var command = {
			action: "roll"
		}
		that.send(command);
	}

	this.stop_roll = function()
	{
		var command = {
			action: "stop_roll"
		}
		that.send(command);
	}

	// Bind buttons
	this.controls.start_btn.onclick = this.start_game;
	this.controls.roll_btn.onclick = this.roll;
	this.controls.stop_roll_btn.onclick = this.stop_roll;
}

function init()
{
	dg = new DiceGame();

	document.getElementById("join_btn").onclick = function(evt)
	{
		name = document.getElementById("player_name").value;
		room_code = document.getElementById("room_code").value;
		dg.join(name, room_code);
	}
}

window.addEventListener("load", init, false);
