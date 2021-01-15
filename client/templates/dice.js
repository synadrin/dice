var dg = undefined;

function DiceGame()
{
	var that = this;

	this.websocket = undefined;
	this.name = "";
	this.room_code = "";
	this.last_message = "";

	this.can_start = false;
	this.can_roll = false;
	this.can_stop = false;

	this.room_members = [];
	this.game_state = null;

	this.controls = {
		start_btn: document.getElementById("start_btn"),
		roll_btn: document.getElementById("roll_btn"),
		stop_roll_btn: document.getElementById("stop_roll_btn"),
	};
	this.controls.start_btn.disabled = true;
	this.controls.roll_btn.disabled = true;
	this.controls.stop_roll_btn.disabled = true;
	this.display = {
		member_list: document.getElementById("member_list"),
	};

	this.tilesheet_img = new Image();
	this.tile_width = 64;
	this.tile_height = 64;

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

	this.update_game_state = function(new_state)
	{
		that.can_start = false;
		that.can_roll = false;
		that.can_stop = false;

		// Is the game over?
		if ("game_over" in new_state && new_state.game_over)
		{
			console.log("Game Over");
			//TODO: Game Over screen
		// Is it our turn?
		} else if ("current_turn_name" in new_state
			&& new_state.current_turn_name == that.name)
		{
			that.can_roll = true;
			that.can_stop = ("can_stop" in new_state && new_state.can_stop);
		}

		that.game_state = new_state;
	}

	this.update_display = function()
	{
		// Switch to game display
		var sign_in = document.getElementById("signin");
		sign_in.style = "display: none;"
		var game_room = document.getElementById("game_room");
		game_room.style = "display: initial;"

		// Button states
		that.controls.start_btn.disabled = !that.can_start;
		that.controls.roll_btn.disabled = !that.can_roll;
		that.controls.stop_roll_btn.disabled = !that.can_stop;

		// Member list
		while (that.display.member_list.lastChild)
		{
			that.display.member_list.removeChild(
				that.display.member_list.lastChild
			);
		}
		for (var i = 0; i < that.room_members.length; i++)
		{
			var item = document.createElement("li");
			item.appendChild(document.createTextNode(
				that.room_members[i]
			));
			that.display.member_list.appendChild(item);
		}

		var p = document.getElementById("debug_console");
		p.textContent = that.last_message;
	}

	this.parse_message = function(message)
	{
		// TODO: Handle parsing problems/validation
		data = JSON.parse(message);

		// Make the message prettier for readability
		that.last_message = JSON.stringify(data, null, 4)
			+ "\n\n" + message;

		if (data.type == "error")
		{
			that.show_error_msg(data.msg);
		} else
		{
			// Update members list
			if ("members" in data)
			{
				this.room_members = data.members;
			}

			// Parse game state
			if ("is_game_active" in data && data.is_game_active
				&& "current_game" in data && data.current_game != null)
			{
				that.update_game_state(data.current_game);
			} else
			{
				that.can_start = ("can_start" in data && data.can_start);
			}

			that.update_display();
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
		name = document.getElementById("player_name_input").value;
		room_code = document.getElementById("room_code_input").value;
		dg.join(name, room_code);
	}
}

window.addEventListener("load", init, false);
