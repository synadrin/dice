var dg = undefined;

function DiceGame()
{
	var that = this;

	this.websocket = undefined;
	this.name = "";
	this.room_code = "";

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
		// Switch to game display
		var sign_in = document.getElementById("signin");
		sign_in.style = "display: hidden;"
		var gs = document.getElementById("gamespace");
		gs.style = "display: initial;"

		var p = document.createElement("p");
		p.textContent = message;
		gs.appendChild(p);
	}

	this.send = function(command)
	{
		return that.websocket.send(JSON.stringify(command));
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
