//
/*
 * Global vars
 */
var COL_COUNT = 7; // local
ROW_COUNT = 6; // global
var WINNER_LENGTH = 4; // local
PLAYER_COUNT = 2; // global

/*
 * Define collections
 */

Cells = new Meteor.Collection("cells");
Games = new Meteor.Collection("games");


/*
 * Define methods that run on the server
 */
Meteor.methods({
	// This must run on the server, since on the client it would throw 
	// 403 reason: "Not permitted. Untrusted code may only remove documents by ID."
	/** Clear all cells and restart. */
	resetGame: function(game) {
//		console.log("resetGame", game._id, game);
		Cells.remove({gameId: game._id});
		
	    for (var r = 0; r < ROW_COUNT; r++) {
	        for (var c = 0; c < COL_COUNT; c++) {
	        	Cells.insert({gameId: game._id, row: r, column: c, move: null });
	        }
	    }	
		game.turn = 1;
		game.status = "new";
    },
    /** Clear all games */
	resetAllGames: function () {
		Games.remove({});
		Cells.remove({});
		createGame(); // initial game Anonymous vs. Anonymous
	},
    /** Delete all inactive games */
	purgeOldGames: function () {
		// TODO: implement this
		console.log("TODO: purgeOldGames");
	}
});

/*
 * Global functions
 */
/** Return current tick counter. */
now = function(){
	return new Date().getTime();
};


//printCollection = function(c){
//	console.log(c.find().fetch());
//};

/** Return user object for a given ID or null. */
findUser = function(userId) {
	var user = Meteor.users.findOne(userId);
	return user;
};

/** Return user name for a given ID or 'Anonymous'. */
findUserName = function(userId) {
	var user = Meteor.users.findOne(userId);
	return user ? user.username : "Anonymous";
};

/** Return game object for a given ID or null. */
findGame = function(gameId) {
	return Games.findOne(gameId);
};

/** Create a new game with `userId` as player1. */
createGame = function(userId) {
	var playerId1 = userId || null,
		game = Games.findOne({playerId1: playerId1, playerId2: null });
	
	if( game ) {
		console.log("createGame: already exists!", game);
		return game;
	}
    var gameId = Games.insert({
    	playerId1: playerId1,
    	playerId2: null,
    	turn: 1,
    	status: "new",
    	created: now(),	
    	modified: now()
	});
    game = findGame(gameId);
//	console.log("createGame", game);
    resetGame(game);
	return game;
};


resetGame = function(game){
	Meteor.call("resetGame", game);
};


resetAllGames = function(){
	Meteor.call("resetAllGames");
};


purgeOldGames = function(){
	Meteor.call("purgeOldGames");
};


/*
 * Local functions
 */
function checkCoords(row, col, msg) {
	if( !(typeof row === "number") || !(typeof col === "number") || row < 0 || row >= ROW_COUNT || col < 0 || col >= COL_COUNT ){
		throw "Bad coords (" + row + ", " + col + ")";
	}
	return true;
};

/** Return cell object for given position. */
getCellAt = function(game, row, col) {
	checkCoords(row, col);
	var cell = Cells.findOne({gameId: game._id, row: row, column: col });
	if(!cell)
		console.log("NOT FOUND: getCellAt", game, row, col, cell);
	return cell;
};


/** Return cell move (1, 2, or null) for given position. */
getMoveAt = function(game, row, col) {
	return getCellAt(game, row, col).move;
};


/** Set cell move (1, 2, or null) for given position. */
function setMoveAt(game, row, col, move) {
	move = move || null;
	checkCoords(row, col);
    Cells.update({gameId: game._id, row: row, column: col}, {$set: {move: move }});
}


/** Return winner vector or null. */
function _checkWinner(game, row, col, move) {
	function _checkVector(row, col, move, dr, dc) {
		var i, r, c, cell,
			winner = [ getCellAt(game, row, col) ];
		
		checkCoords(row, col);
		for(i=1; i<WINNER_LENGTH; i++){
			r = row + (dr * i);
			c = col + (dc * i);
			cell = getCellAt(game, r, c);
			if( cell.move !== move ){
				return null;
			}
			winner.push(cell);
		}
		console.log(row, col, winner);
		return winner;
	}
	var res = null;
	// Horizontal streak, starting from row/col to the right
	if( !res && col <= COL_COUNT - WINNER_LENGTH ){
		res = _checkVector(row, col, move, 0, 1);
	}
	// Vertical streak, starting from row/col to bottom
	if( !res && row <= ROW_COUNT - WINNER_LENGTH ){
		res = _checkVector(row, col, move, 1, 0);
	}
	// Diagonal streak, starting from row/col to bottom/right
	if( !res && row <= ROW_COUNT - WINNER_LENGTH && col <= COL_COUNT - WINNER_LENGTH ){
		res = _checkVector(row, col, move, 1, 1);
	}
	// Diagonal streak, starting from row/col to bottom/left
	if( !res && row <= ROW_COUNT - WINNER_LENGTH && col >= WINNER_LENGTH - 1 ){
		res = _checkVector(row, col, move, 1, -1);
	}
	return res;
}

/** Check if we have '4-in-a-row' and return the cell vector ([] otherwise). */
findWinner = function(game) {
	var winner = null;
  	for (var row = 0; row < ROW_COUNT; row++) {
	    for (var  col = 0; col < COL_COUNT; col++) {
	    	var move = getMoveAt(game, row, col);
	    	if( move ){
	    		winner = _checkWinner(game, row, col, move);
	    		if( winner ){
	    			return winner;
	    		}
	    	}
	    }
  	}
  	return [];
};
