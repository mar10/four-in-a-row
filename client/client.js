/*
 * Client startup
 */
Meteor.startup(function () {
	Accounts.ui.config({
//		passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
		passwordSignupFields: "USERNAME_ONLY"
	});
});

/*
 * Local functions
 */
changeTurn = function(game) {
	game = game || activeGame();
	// Current turn is stored as integer (1 | 2)
	// So this function toggles 1/2
	var i = parseInt(game.turn, 10) || 1;
	i = (i % PLAYER_COUNT) + 1;
	Games.update(game._id, {$set: {turn: i, status: "started", modified: now()}});
	Session.set("turnPlayerId", currentTurnPlayerId());
	console.log("changeTurn, player=", currentTurnPlayerId());
};


gameHasWinner = function(winner) {
	if (winner.length > 0) {
		console.log("winner", winner);
		$(".available").removeClass("available");
		$.each(winner, function(index, cell) {
			Cells.update(cell._id, {$set: {winner: true}});
		});
		Games.update(Session.get("activeGameId"), {$set: {status: "closed", modified: now()}});
	};
};

/*
 * Global client functions
 */
joinGame = function(game) {
	var myId = Meteor.userId();

	if( game.playerId1 === myId || game.playerId2 === myId ){
		console.log("already joined");
		return game;
	}
	if( game.playerId1 === null && game.playerId2 === null ){
		console.log("cannot join the default game");
		return false;
	}
	Games.update(game._id, {$set: {playerId2: myId, status: "started", modified: now()}});
	return game;
};

/** Return active game object or null. */
activeGame = function() {
	var gameId = Session.get("activeGameId");
	return game = findGame(gameId);
};

/** Return current turn (1 or 2) or null. */
currentTurn = function() {
	var game = activeGame();
	return game ? game.turn : null;
};

/** Return user id that has current turn or null. */
currentTurnPlayerId = function() {
	var game = activeGame(),
		turn = game ? game.turn : null;
//	console.log("currentTurnPlayerId", game);
	return turn == 1 ? game.playerId1 : turn == 2 ? game.playerId2 : null;
};


isMyTurn = function() {
	return currentTurnPlayerId() === Meteor.userId();
};
