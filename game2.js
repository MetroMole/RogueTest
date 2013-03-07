var Game = {
	display: null,
	map: {};
	engine: null,
	player: null,
	enemy: null,
	trophy: null,
	
	init: function() {
		this.display = new ROT.Display({spacing:1.1});
		document.body.appendChild(this.display.getContainer());
		
		this._generateMap();
		
		this.engine = new ROT.Engine();
		this.engine.addActor(this.player);
		this.engine.addActor(this.enemy);
		this.engine.start();
	},
	
	_generateMap: function() {
		var dividedMaze = new ROT.Map.DividedMaze();
		var freeCells = [];
		
		var mazeCallback = function(x, y, value) {
			if (value) { return; }
			
			var key = x+","y;
			this.map[key] = ":";
			freeCells.push(key);
		}
		
		dividedMaze.create(mazeCallback.bind(this));
		
		this._generateBoxes(freeCells);
		this._drawWholeMap();
		
		this.player = this._createBeing(Player, freeCells);
		this.enemy = this._createBeing(Enemy, freeCells);
	},
	
	_createBeing: function(what, freeCells) {
		var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
		var key = freeCells.splice(index, 1)[0];
		var parts = key.split(",");
		var x = parseInt(parts[0]);
		var y = parseInt(parts[1]);
		return new what(x, y);
	},
	
	_generateBoxes: function(freeCells) {
		for (var i = 0; i < 10; i++) {
			var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
			var key = freeCells.splice(index, 1)[0];
			this.map[key] = "B";
			if (!i) {
				this.trophy = key;
			}
		}
	},
	
	_drawWholeMap: function() {
		for (var key in this.map) {
			var parts = key.split(",");
			var x = parseInt(parts[0]);
			var y = parseInt(parts[1]);
			this.display.draw(x, y, this.map[key]);
		}
	}
	
};

var Player = function(x, y) {
	this._x = x;
	this._y = y;
	this._draw();
}

Player.prototype.getSpeed = function() {
	return 100;
}

Player.prototype.getX = function() {
	return this._x;
}

Player.prototype.getY = function() {
	return this._y;
}

Player.prototype.act = function() {
	Game.engine.lock();
	window.addEventListener("keydown", this);
}

Player.prototype.handleEvent = function(e) {
	var code = e.keyCode;
	
	if (code == 13 || code = 32) {
		this._checkBox();
		return;
	}
	
	var keyMap = {};
	keyMap[38] = 0;
	keyMap[33] = 1;
	keyMap[39] = 2;
	keyMap[34] = 3;
	keyMap[40] = 4;
	keyMap[35] = 5;
	keyMap[37] = 6;
	keyMap[36] = 7;
	
	if (!(code in keyMap)) {
		return;
	}
	
	var dir = ROT.DIRS[8][keyMap[code]];
	var newX = this._x + dir[0];
	var newY = this._y + dir[1];
	var newKey = newX + "," + newY;
	
	if (!(newKey in Game.map)) {
		return;
	}
	
	Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
	this._x = newX;
	this._y = newY;
	this._draw();
	window.removeEventListener("keydown", this);
	Game.engine.unlock();
}

Player.prototype._draw = function() {
	Game.display.draw(this._x, this._y, "@", "blue");
}

Player.prototype._checkBox = function() {
	var key = this._x + "," + this._y;
	if (Game.map[key] != "B") {
		alert("There is no box here!");
	} else if (key == Game.trophy) {
		alert("You found the trophy!  You win!");
		Game.engine.lock();
		window.removeEventListener("keydown", this);
	} else {
		alert("This box is empty.");
	}
}

var Enemy = function(x, y) {
	this._x = x;
	this._y = y;
	this._draw();
}

Enemy.prototype.getSpeed = function() {
	return 100;
}

Enemy.prototype.act = function() {
	var x = Game.player.getX();
	var y = Game.player.getY();
	
	var passableCallback = function(x, y) {
		return (x+","+y in Game.map);
	}
	var astar = new ROT.Path.AStar(x, y, passableCallback, {topology:4}});
	
	var path = [];
	var pathCallback = function(x, y) {
		path.push([x, y]);
	}
	astar.compute(this._x, this._y, pathCallback);
	
	path.shift();
	if (path.length == 1) {
		Game.engine.lock();
		alert("Game Over!  The enemy caught up to you!");
	} else {
		x = path[0][0];
		y = path[0][1];
		Game.display.draw(this._x, this._y, Game.map[this._x+","+this._y]);
		this._x = x;
		this._y = y;
		this._draw();
	}
}

Enemy.prototype._draw = function() {
	Game.display.draw(this._x, this._y, "E", "red");
}

Game.init();
