/*
 * Local functions
 */
function _gameChanged(gameId){
	gameId = gameId || $("#gameList option:selected").attr("name");
	var game = findGame(gameId);
	Session.set("activeGameId", game._id);
	Session.set("turnPlayerId", game.turn);
	console.log("change game", game);
}

/*
 * Template helpers for game
 */
Template.game.events({
  "click td.movement.available, touchstart td.movement.available" : function(e){
	// 'this' is the clicked cell object
//    console.log("CLICK cell", this._id, this);
	  if( !isMyTurn() ){
		  alert("It's not your turn: you:" + Meteor.userId() + ", turn: " + currentTurn() + "=" + currentTurnPlayerId());
//		  return;
	  }
    var cell, $cell,
    	row = this.row,
    	game = activeGame();
    // Drop cell marker as deep as possible
    while( row < (ROW_COUNT - 1) && !getMoveAt(game, row + 1, this.column)){
    	row += 1;
    }
//    console.log("CLICK cell dropped", row, this.column);
    cell = getCellAt(game, row, this.column);
    
    // Mark <td> as unavailable
    $cell = $("div.container tr.row:nth-of-type(" + (row+1) + ")")
    	.find("td:nth-of-type(" + (this.column+1) + ")");
    $cell.removeClass("available");
//    console.log("CLICK cell dropped", cell, $cell);

//    turn = Turns.findOne();
    
    // TODO: row and columns can be omitted?
    Cells.update(cell._id, {$set: { move: game.turn }});
//    Cells.update(cell._id, { move: turn.turn });
//    setMoveAt(this._id, { row: this.row, column: this.column, move: turn.turn });
    changeTurn(game);

    winner = findWinner(game);
    gameHasWinner(winner);
  }
});

/*
 * Template helpers for gameList
 */
Template.gameList.games = function(){
	return Games.find();
};

Template.gameList.userName = function(userId){
	var user = findUser(userId);
	return "" + (user ? (user.username /* || user.emails[0]*/) : "Anonymous");
};


Template.gameList.isActiveGame = function(){
	return this._id === Session.get("activeGameId");
};


Template.gameList.rendered = function(){
	if( ! Session.get("activeGameId") ){
		console.log("Initializing gameId");
		setTimeout(function(){
			_gameChanged();
		}, 1000);
	}
};


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
	turn = turn || Session.get("turnId");
	var game = activeGame();
	if( !game )
		return "???";
	var playerId = turn == 1 ? game.playerId1 : game.playerId2;
	return player = findUserName(playerId);
};

/** Return "active" if it is requested player's turn.*/
Template.turn.activeIf = function(playerIndex) {
	var gameId = Session.get("activeGameId"),
		turnId = Session.get("turnPlayerId"),
		game = findGame(gameId);
	if( !game )
		return "";
	var playerId = playerIndex == "1" ? game.playerId1 : game.playerId2;
	return ( playerId ===  turnId ) ? "active" : "";
};
	
/*
 * Template helpers for listRows
 */
Template.listRows.rows = function(){
	var cols, i,
		row = 0,
		gameId = Session.get("activeGameId") ,
		rows = [];
	
	for(i=0; i<ROW_COUNT; i++){
		cols = Cells.find({gameId: gameId, row: row + i}, {sort: {column: 1}});
		rows.push({row: row, cols: cols.fetch()});
	}
	console.log("listRows", gameId, rows);
	return rows;
};
