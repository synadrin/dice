var dg = undefined;

function dismiss_error(id)
{
	var elem = document.getElementById(id);
	elem.remove();
}

function DiceGame()
{
	var that = this;

	var DICE_MAX_VALUE = 6;
	var DICE_MIN_VALUE = 1;

	this.websocket = undefined;
	this.name = "";
	this.room_code = "";
	this.last_message = "";
	this.in_room = false;

	this.is_game_active = false;
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

	this.last_error_no = 0;
	this.winner_notice_dismissed = false;
	this.display = {
		error_msgs: document.getElementById("error_msgs"),
		sign_in: document.getElementById("signin"),
		game_room: document.getElementById("game_room"),
		player_name: document.getElementById("player_name"),
		room_code: document.getElementById("room_code"),
		member_list: document.getElementById("member_list"),
		game_space: document.getElementById("game_space"),
		current_turn_name: document.getElementById("current_turn_name"),
		current_score: document.getElementById("current_score"),
		last_roll_score: document.getElementById("last_roll_score"),
		dice_canvas: document.getElementById("dice"),
		players: document.getElementById("players"),
		winner_overlay: document.getElementById("winner_overlay"),
		winner_name: document.getElementById("winner_name"),
		debug_console: document.getElementById("debug_console"),
	};

	this.dice_ctx = this.display.dice_canvas.getContext("2d");
	this.offscreen_canvas = document.createElement("canvas");
	this.offscreen_canvas.width = that.display.dice_canvas.width;
	this.offscreen_canvas.height = that.display.dice_canvas.height;
	this.offscreen_ctx = this.offscreen_canvas.getContext("2d");
	this.tilesheet_loaded = false;
	this.tilesheet_img = new Image();
	this.tilesheet_img.onload = function()
	{
		that.tilesheet_loaded = true;
	}
	this.tilesheet_img.src = TOP_URL + "/dice-tilesheet.png";
	this.tile_width = 64;
	this.tile_height = 64;
	this.tile_padding = 8;

	this.currentTime = Date.now();
	this.roll_animation = {
		running: false,
		frame_timeout: 100,
		total_timeout: 1000,
		current_timer: 0,
		frame_timer: 0,
		request_id: undefined,
	};

	// TODO: Customisable
	this.dice_set = 1;

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
			// Switch back to join screen
			that.in_room = false;
			that.update_display();
		}
	}

	this.get_random_int = function(min, max)
	{
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	this.clear_canvas = function()
	{
		that.offscreen_ctx.clearRect(0, 0,
			that.display.dice_canvas.width, that.display.dice_canvas.height);
	}

	this.flip_canvas = function()
	{
		that.dice_ctx.clearRect(0, 0,
			that.display.dice_canvas.width, that.display.dice_canvas.height);
		that.dice_ctx.drawImage(that.offscreen_canvas, 0, 0);
	}

	this.draw_die = function(position, value, locked)
	{
		lock_x = DICE_MAX_VALUE * that.tile_width;
		if (that.tilesheet_loaded && that.is_game_active)
		{
			src_x = (value - 1) * that.tile_width;
			src_y = that.dice_set * that.tile_height;
			dst_x = (position + 1) * that.tile_padding
				+ (position * that.tile_width);
			dst_y = that.tile_padding;
			that.offscreen_ctx.drawImage(that.tilesheet_img,
				src_x, src_y, that.tile_width, that.tile_height,
				dst_x, dst_y, that.tile_width, that.tile_height);

			if (locked)
			{
				that.offscreen_ctx.drawImage(that.tilesheet_img,
					lock_x, src_y, that.tile_width, that.tile_height,
					dst_x, dst_y, that.tile_width, that.tile_height);
			}
		}
	}

	this.draw_dice = function()
	{
		that.clear_canvas();

		dice = that.game_state.dice;
		for (var i = 0; i < dice.length; i++)
		{
			that.draw_die(i, dice[i].value, dice[i].locked);
		}

		that.flip_canvas();
	}

	this.dismiss_winner = function()
	{
		that.display.winner_overlay.style.display = "none";
		that.winner_notice_dismissed = true;
		return false;
	}

	this.update_game_state = function(new_state)
	{
		that.can_start = false;
		that.can_roll = false;
		that.can_stop = false;

		// Is the game over?
		if ("game_over" in new_state && new_state.game_over)
		{
			if (typeof DEBUG !== 'undefined' && DEBUG)
			{
				console.log("Game Over");
			}
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
		if (that.in_room)
		{
			// Switch to game_room display
			that.display.sign_in.style.display = "none";
			that.display.game_room.style.display = "initial";

			// Room info
			that.display.player_name.innerHTML = that.name;
			that.display.room_code.innerHTML = that.room_code;

			// Button states
			that.controls.start_btn.disabled = !that.can_start;
			that.controls.roll_btn.disabled = !that.can_roll;
			that.controls.stop_roll_btn.disabled = !that.can_stop;

			if (that.is_game_active)
			{
				// Game info
				that.display.current_turn_name.innerHTML
					= that.game_state.current_turn_name;
				that.display.current_score.innerHTML
					= that.game_state.current_score;
				that.display.last_roll_score.innerHTML
					= that.game_state.last_roll_score;

				// Dice
				that.draw_dice();

				// Players
				while (that.display.players.lastChild)
				{
					that.display.players.removeChild(
						that.display.players.lastChild
					);
				}
				var players = that.game_state.players;
				for (var i = 0; i < players.length; i++)
				{
					var row = document.createElement("tr");
					var td_turn = document.createElement("td");
					var td_name = document.createElement("td");
					var td_score = document.createElement("td");
					td_turn.className = "player_turn";
					if (that.game_state.current_turn == i)
					{
						td_turn.appendChild(document.createTextNode(
							">>>"
						));
						row.className = "current_turn";
					}
					td_name.className = "player_name";
					td_name.appendChild(document.createTextNode(
						players[i].name
					));
					td_score.className = "player_score";
					td_score.appendChild(document.createTextNode(
						players[i].score
					));
					row.appendChild(td_turn);
					row.appendChild(td_name);
					row.appendChild(td_score);
					that.display.players.appendChild(row);
				}
			}

			// Winner display
			if ("game_over" in that.game_state && that.game_state.game_over
				&& !that.winner_notice_dismissed)
			{
				that.display.winner_name.innerHTML = that.game_state.winner;
				that.display.winner_close_btn.onclick = that.dismiss_winner;
				that.display.winner_overlay.style.display = "initial";
			}

			// Room member list
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
		} else
		{
			// Show sign in form(s)
			that.display.sign_in.style.display = "initial";
			that.display.game_room.style.display = "none";
		}

		if (typeof DEBUG !== 'undefined' && DEBUG)
		{
			that.display.debug_console.textContent = that.last_message;
		}
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
			// Interrupt rolling animation
			that.animation_stop();

			if ("room_code" in data)
			{
				that.room_code = data.room_code;
				that.in_room = true;
			}

			// Update members list
			if ("members" in data)
			{
				this.room_members = data.members;
			}

			// Parse game state
			that.is_game_active = ("is_game_active" in data && data.is_game_active
				&& "current_game" in data && data.current_game != null)
			if (that.is_game_active)
			{
				that.update_game_state(data.current_game);
			} else
			{
				that.can_start = ("can_start" in data && data.can_start);
			}
		}

		that.update_display();
	}

	this.animation_update = function()
	{
		var now = Date.now();
		var deltaT = now - that.currentTime;

		that.roll_animation.current_timer -= deltaT;
		that.roll_animation.frame_timer -= deltaT;

		if (that.roll_animation.current_timer <= 0)
		{
			that.animation_stop();
			that.roll();
		} else if (that.roll_animation.frame_timer <= 0)
		{
			that.roll_animation.frame_timer = that.roll_animation.frame_timeout;
			that.animation_draw();
		}

		that.currentTime = now;
	}

	this.animation_draw = function()
	{
		that.clear_canvas();

		dice = that.game_state.dice;
		for (var i = 0; i < dice.length; i++)
		{
			if (dice[i].locked)
			{
				that.draw_die(i, dice[i].value, dice[i].locked);
			} else
			{
				var value = that.get_random_int(DICE_MIN_VALUE, DICE_MAX_VALUE);
				that.draw_die(i, value, false);
			}
		}

		that.flip_canvas();
	}

	this.animation_loop = function()
	{
		if (that.roll_animation.running)
		{
			that.animation_update();
			that.roll_animation.request_id = window.requestAnimationFrame(
				that.animation_loop
			);
		}
	}

	this.animation_stop = function()
	{
		if (that.roll_animation.running)
		{
			window.cancelAnimationFrame(that.roll_animation.request_id);
			that.roll_animation.request_id = undefined;
		}
		that.roll_animation.running = false;
	}

	this.roll_click = function()
	{
		if (!that.roll_animation.running)
		{
			that.roll_animation.running = true;
			that.roll_animation.current_timer = that.roll_animation.total_timeout;
			that.roll_animation.frame_timer = that.roll_animation.frame_timeout;
			that.currentTime = Date.now();
			that.animation_loop();
		}
	}

	this.send = function(command)
	{
		return that.websocket.send(JSON.stringify(command));
	}

	this.show_error_msg = function(error_msg)
	{
		var error_no = ++that.last_error_no;
		var d = document.createElement("div");
		var p = document.createElement("p");
		var x = document.createElement("a");

		var msg_id = "error_msg_id" + error_no;
		d.id = msg_id;
		d.className = "error_msg";

		x.setAttribute("href", "javascript:dismiss_error('" + msg_id + "');");
		x.className = "close_btn";
		x.appendChild(document.createTextNode("X"));

		p.appendChild(document.createTextNode(error_msg));

		d.appendChild(x);
		d.appendChild(p);
		that.display.error_msgs.appendChild(d);

		if (typeof DEBUG !== 'undefined' && DEBUG)
		{
			console.log(error_msg);
		}
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
		that.winner_notice_dismissed = false;
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
	this.controls.roll_btn.onclick = this.roll_click;
	this.controls.stop_roll_btn.onclick = this.stop_roll;

	// Update display
	this.update_display();
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
