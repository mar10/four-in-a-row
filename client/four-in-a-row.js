Template.turn.turn = function(){
    return Turns.findOne();
};
Template.turn.turnIs = function (move) {
	var turn = Turns.findOne(); 
	return turn ? turn.turn === move : "";
};
	
Template.listRows.rows = function(){
//  return [1,2,3];
	var a = [];
	for(var i=0; i<ROW_COUNT; i++)
		a.push(i);
	return a;
};

var row = 0;
Template.listCells.cells = function(){
//    console.log("listCells", row, this);
    return Cells.find({ row: row++ }, {sort: {column: 1}});
};

Template.game.events({
  "click td.movement.available" : function(e){
	// 'this' is the clicked cell object
//    console.log("CLICK cell", this._id, this);
    var cell, $cell,
    	row = this.row;
    // Drop cell marker as deep as possible
    while( row < (ROW_COUNT - 1) && !getMoveAt(row + 1, this.column)){
    	row += 1;
    }
//    console.log("CLICK cell dropped", row, this.column);
    cell = getCellAt(row, this.column);
    
    // Mark <td> as unavailable
    $cell = $("div.container tr.row:nth-of-type(" + (row+1) + ")")
    	.find("td:nth-of-type(" + (this.column+1) + ")");
    $cell.removeClass("available");
//    console.log("CLICK cell dropped", cell, $cell);

    turn = Turns.findOne();
    
    // TODO: row and columns can be omitted?
    Cells.update(cell._id, { row: cell.row, column: cell.column, move: turn.turn });
//    Cells.update(cell._id, { move: turn.turn });
//    setMoveAt(this._id, { row: this.row, column: this.column, move: turn.turn });
    changeTurn(turn);

    winner = findWinner();
    gameHasWinner(winner);
  }
});


Template.resetCells.events({
  'click button': function(){
    console.log("CLICK reset", this._id, this);
    resetCells();
    resetTurn();
  }
});

var changeTurn = function(turn){
  if (turn.turn == "x") {
    Turns.update(turn._id, { turn: 'o' } );
  } else {
    Turns.update(turn._id, { turn: 'x' } );
  }
};

var gameHasWinner = function(winner){
  if (winner.length > 0) {
	console.log("winner", winner);
    $(".available").removeClass("available");
    $.each(winner, function(index, cell){
      Cells.update(cell._id, { row: cell.row, column: cell.column, move: cell.move, winner: true })
    });
  };
}

