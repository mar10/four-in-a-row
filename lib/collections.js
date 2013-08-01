Cells = new Meteor.Collection("cells");
Turns = new Meteor.Collection("turns");

// Define methods that run on the server
Meteor.methods({
	resetCells: function() {
		// Throws 403 reason: "Not permitted. Untrusted code may only remove documents by ID."
		Cells.remove({});
		startCells();
    },
    resetTurn: function () {
		// Throws 403 reason: "Not permitted. Untrusted code may only remove documents by ID."
		Turns.remove({});
	    Turns.insert({turn: 'x'});
    }
});

var COL_COUNT = 7;
ROW_COUNT = 6;
var WINNER_LENGTH = 4;


resetCells = function(){
//  Cells.remove({});
//	startCells();
	Meteor.call("resetCells");
};

resetTurn = function(){
//    Turns.remove({});
//    Turns.insert({turn: 'x'});
	Meteor.call("resetTurn");
};

startCells = function(){
  for (var r = 0; r < ROW_COUNT; r++) {
    for (var c = 0; c < COL_COUNT; c++) {
    	setMoveAt(r, c);
    }
  }
};

checkCoords = function(row, col, msg) {
	if( !(typeof row === "number") || !(typeof col === "number") || row<0 || row >= ROW_COUNT || col < 0 || col >= COL_COUNT ){
		throw "Bad coords (" + row + ", " + col + ")";
	}
	return true;
};

getCellAt = function(row, col) {
	checkCoords(row, col);
	var cell = Cells.findOne({ row: row, column: col });
	if(!cell)
		console.log("getCellAt", row, col, cell)
	return cell;
};

getMoveAt = function(row, col) {
	return getCellAt(row, col).move;
};

function setMoveAt(row, col, move) {
	checkCoords(row, col);
    Cells.insert({ row: row, column: col, move: move });
}

/**
 * Return winner vector or null
 */
function _checkWinner(row, col, move) {
//	console.log("check", row, col, move)
	function _checkVector(row, col, move, dr, dc) {
		var i, r, c, cell,
			winner = [ getCellAt(row, col) ];
		
		checkCoords(row, col);
		for(i=1; i<WINNER_LENGTH; i++){
			r = row + (dr * i);
			c = col + (dc * i);
			cell = getCellAt(r, c);
			if( cell.move !== move ){
//				console.log(r, c, getMoveAt(r, c), move);
				return null;
			}
//			console.log(r, c, move);

			winner.push(cell);
		}
		console.log(row, col, winner);
		return winner;
	}
	// 
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
//		console.log("check diag", row, col, move);
		res = _checkVector(row, col, move, 1, -1);
	}
	return res;
}


findWinner = function(game) {
	var winner = null;
  	for (var row = 0; row < ROW_COUNT; row++) {
	    for (var  col = 0; col < COL_COUNT; col++) {
	    	var move = getMoveAt(row, col);
	    	if( move ){
	    		winner = _checkWinner(row, col, move);
	    		if( winner ){
	    			return winner;
	    		}
	    	}
	    }
  	}
  	return [];
};
