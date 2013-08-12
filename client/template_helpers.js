/*
 * Local functions
 */
/** Activate another game (default to combobox selection). */
function _gameChanged(gameId){
	gameId = gameId || $("#gameList option:selected").attr("name");
	var game = findGame(gameId);
	Session.set("activeGameId", game._id);
	console.log("change game", game);
}

/*
 * Template helpers for game
 */
/** True if the board could be loaded (sometimes fails after a backend refresh) */
Template.game.isGameLoaded = function(){
	return !!findGame(Session.get("activeGameId"));
};

/** Handle column clicks to set a disk. */
var MIN_DELAY_MS = 400,
	_last_click_time = 0;

Template.game.events({
	"click td.movement.available, touchstart td.movement.available" : function(e){
// 		'this' is the clicked cell object
//    	console.log("CLICK cell", this._id, this);
		// Sometimes we get double events on iPad touches and others: ignore them
		// TODO: why?
		if( (now() - _last_click_time) < MIN_DELAY_MS ){
			console.log("Ignoring fast second click");
			return false;
		} 
		_last_click_time = now();
		
		var cell, $cell,
		row = this.row,
		game = activeGame();

		if( game.status === "closed" ){
			alert("The game is closed.");
			return false;
		}
		if( !isMyTurn() ){
//			alert("It's not your turn: you:" + Meteor.userId() + ", turn: " + currentTurn() + "=" + currentTurnPlayerId());
//				console.log("currentTurnPlayerId", game);
			alert("Sorry " + findUserName(Meteor.userId()) + ", it's " + findUserName(currentTurnPlayerId()) + "'s turn.");
			return false;
		}
        // Drop cell marker as deep as possible
	    while( row < (ROW_COUNT - 1) && !getMoveAt(game, row + 1, this.column)){
	    	row += 1;
	    }
	    cell = getCellAt(game, row, this.column);
    
	    // Mark <td> as unavailable
	    $cell = $("div.container tr.row:nth-of-type(" + (row+1) + ")")
	    	.find("td:nth-of-type(" + (this.column+1) + ")");
	    $cell.removeClass("available");
	    
	    Cells.update(cell._id, {$set: { move: game.turn }});
	
	    changeTurn(game);
	
	    winner = findWinner(game);
	    gameHasWinner(winner);
	}
});

/*
 * Template helpers for gameList
 */
/** Return a list of all existing games. */
Template.gameList.games = function(){
	return Games.find();
};

/** Return user display name for id (null: 'Anonymous'). */
Template.gameList.userName = function(userId){
	var user = findUser(userId);
	return "" + (user ? (user.username /* || user.emails[0]*/) : "Anonymous");
};

/** True if this game option is the currently active game (i.e. selected)*/
Template.gameList.isActiveGame = function(){
	return this._id === Session.get("activeGameId");
};

/** Make sure the combobox selection is applied on first load. */
Template.gameList.rendered = function(){
	if( ! Session.get("activeGameId") ){
		console.log("Initializing gameId");
		setTimeout(function(){
			_gameChanged();
		}, 1000);
	}
};

/** Handle buttons and combobox changes. */
Template.gameList.events({
	"change #gameList": function(){
		_gameChanged();
	},
	"click #newGame": function(){
		if( !Meteor.userId() ){
			alert("Please sign in to create a new game.");
			return false;
		}
		var game = createGame(Meteor.userId());
		_gameChanged(game._id);
	},
	"click #joinGame": function(){
		var game = activeGame(),
			myId = Meteor.userId();
		if( game.status !== "new" ){
			alert("Only new games can be joined.");
			return false;
		}
		if( !myId ){
			alert("Please sign in to join a game.");
			return false;
		}
		if( game.playerId1 === null && game.playerId2 === null ){
			alert("You cannot join the default game.\nChoose another game, or create a new one.");
			return false;
		}
		if( game.playerId1 === myId || game.playerId2 === myId ){
			alert("You already joined this game.");
			return game;
		}
		if( game.playerId2 !== null ){
			alert("This game was already joined by someone else.\nChoose another game, or create a new one.");
			return false;
		}
		joinGame(game);
	},
	"click #resetGame": function(){
		var game = activeGame(),
			myId = Meteor.userId();
		if( game.playerId1 !== myId && game.playerId2 !== myId ){
			alert("You can only reset games that you have joined.");
			return false;
		}
		resetGame(game);
	},
	"click #resetAllGames": function(){
		if( !confirm("This will delete ALL games.\nAre you sure?") ){
			return false;
		}
		Meteor.call("resetAllGames");
		setTimeout(function(){
			console.log("trigger change game");
//			$("#gameList").change();
			_gameChanged();
		}, 1000);
	}
});


/*
 * Template helpers for turn
 */
/** Return true if it is authenticated user's turn. */
Template.turn.isMyTurn = isMyTurn;

/** Return name of user that has the next turn.*/
Template.turn.turnUserName = function (ownName) {
	if( ownName && isMyTurn() ){
		return ownName;
	}
	return findUserName(currentTurnPlayerId());
};

/** Return arbitrary session value */
Template.turn.sessionGet = function(key) {
	return Session.get(key);
};

/** Return active game object. */
Template.turn.currentGame = function() {
	return activeGame() || {};
};

/** Return name of player X ()*/
Template.turn.playerName = function(turn) {
	var game = activeGame();
	if( !game )
		return "???";
	var playerId = (turn == "1") ? game.playerId1 : game.playerId2;
//	console.log("Template.turn.playerName", turn, game.turn, playerId, game);
	return player = findUserName(playerId);
};

/** Return "active" if it is requested player's turn.*/
Template.turn.activeIf = function(playerIndex) {
	var game = activeGame();
	return ( game && game.turn ==  playerIndex ) ? "active" : "";
};
	
/*
 * Template helpers for listRows
 */
/** Return a nested list of rows and cells. */
Template.listRows.rows = function(){
	var cols, i,
		row = 0,
		gameId = Session.get("activeGameId") ,
		rows = [];
	
	for(i=0; i<ROW_COUNT; i++){
		cols = Cells.find({gameId: gameId, row: row}, {sort: {column: 1}});
		rows.push({row: row, cols: cols.fetch()});
		row += 1;
	}
//	console.log("listRows", gameId, rows);
	return rows;
};
