// Global vars.
let canvas, ctx, pieces;
let positionsSeen, threefoldRep;

function getImagesfromDom() {

	let pieces = {
		"white-king" : $("#white-king").get(0),
		"white-knight" : $("#white-knight").get(0),
		"white-rook" : $("#white-rook").get(0),
		"black-king" : $("#black-king").get(0),
		"black-knight" : $("#black-knight").get(0),
		"black-rook" : $("#black-rook").get(0),
	}
	
	return pieces

}

function drawBoard(ctx, pieceList, tileSelected, legalMoves) {
	const darkTileColor = "#b58863";
	const lightTileColor = "#f0d9b5 ";
	const highlightColor = "rgba(10, 255, 10, 0.15)";
	const indicatorColor = "rgba(0, 0, 0, 0.25)";
	const pieceScale = 220
	
	// draw: board
	ctx.fillStyle = darkTileColor;
	ctx.fillRect(0, 0, 100, 100);
	ctx.fillRect(200, 0, 100, 100);
	ctx.fillRect(400, 0, 100, 100);
	ctx.fillRect(600, 0, 100, 100);
	
	ctx.fillStyle = lightTileColor;
	ctx.fillRect(100, 0, 100, 100);
	ctx.fillRect(300, 0, 100, 100);
	ctx.fillRect(500, 0, 100, 100);
	ctx.fillRect(700, 0, 100, 100);
	
	// draw: highlighted tile
	if (tileSelected != -1) {
		ctx.fillStyle = highlightColor;
		ctx.fillRect(tileSelected*100, 0, 100, 100);
	}
	
	// draw: pieces
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i] != "Empty") {
			ctx.drawImage(pieces[pieceList[i]], i*100, 0, 8*pieceScale, pieceScale);
		}
	}
	
	// draw: legal move indicators
	if (legalMoves) {
		for (let i = 0; i < legalMoves.length; i++) {
			ctx.strokeStyle = indicatorColor;
			ctx.fillStyle = indicatorColor;
			ctx.beginPath();
			if (pieceList[legalMoves[i]] == "Empty") {
				// draw circle
				ctx.arc(legalMoves[i]*100+50, 50, 15, 0, 2*Math.PI);	
			} else {
				// draw ring
				ctx.arc(legalMoves[i]*100+50, 50, 45, 0, 2*Math.PI);
				ctx.arc(legalMoves[i]*100+50, 50, 40, 0, 2*Math.PI);
			}
			ctx.fill("evenodd");
		}
	}
}

//from: https://stackoverflow.com/a/5417934
function getCursorPosition(e) {
	let x, y;

	canoffset = canvas.offset();
	x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - Math.floor(canoffset.left);
	y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - Math.floor(canoffset.top) + 1;

	return [x,y];
}

// Returns the index of the chess tile that was clicked on thefrom click event 'e'
function getTileFromClick(e) {
	return Math.floor(getCursorPosition(e)[0]/100);
}

// Returns all the possible moves for the piece at 'startPos' 
// (assumes piece at 'startPos' has color: 'turn')
// DOESNT check if king is in check
function getPossbleMoves(startPos, pieceList, turn) {
	
	function potentialMove(x) {
		return 0 <= x && x <= 7 && !pieceList[x].includes(turn);
	}
	
	let possibleMoves = []; // moves allow by rules of piece
	
	let pieceType = pieceList[startPos].split("-")[1];
	switch(pieceType) {
		case "king":
			if (potentialMove(startPos+1)) {
				possibleMoves.push(startPos+1);
			}
			if (potentialMove(startPos-1)) {
				possibleMoves.push(startPos-1);
			}
			break;
		case "knight":
			if (potentialMove(startPos+2)) {
				possibleMoves.push(startPos+2);
			}
			if (potentialMove(startPos-2)) {
				possibleMoves.push(startPos-2);
			}
			break;
		case "rook":
			//TODO: clean this up
			// leftwards moves:
			if (startPos !== 0){ // Check if rook is on left edge of board
			  for (let i = startPos-1; i >= 0; i--){
				if (pieceList[i] != "Empty") {
				  // There is a piece in the way so rook cannot move past here
				  // But, check if we can take the piece in the way
				  if ( !pieceList[i].includes(turn) ) {
					  possibleMoves.push(i);
				  }
				  break;
				} else {
				  possibleMoves.push(i);
				}
			  }
			}
			// Rightward moves:
			// Check if rook is on right edge of board
			if (startPos !== 7){
			  for (let i = startPos+1; i <= 7; i++){
				if (pieceList[i] != "Empty"){
				  // There is a piece in the way so rook cannot move past here
				  // But, check if we can take the piece in the way
				  if ( !pieceList[i].includes(turn) ) {
					  possibleMoves.push(i);
				  }
				  break;
				} else {
				  possibleMoves.push(i);
				}
			  }
			}
			break;
	}
	
	return possibleMoves;
}

// Returns all the legal moves for the piece at 'startPos' 
// (assumes piece at 'startPos' has color: 'turn')
// Checks if king is in check
function getLegalMoves(startPos, pieceList, turn) {
	
	let possibleMoves = getPossbleMoves(startPos, pieceList, turn);
	let legalMoves = []; //moves allowed by rules of piece AND doesn't put king in check
	
	// check if king now in check
	possibleMoves.forEach(function(endPos) {	
		// make the potential move in 'newPieceList'
		newPieceList = [...pieceList];
		// Check if king would be in check
		makeMove(startPos, endPos, newPieceList);
		if (!inCheck(newPieceList, turn)) {
			legalMoves.push(endPos)
		}	
	});
			
	return legalMoves;
}

// moves piece at 'from' to 'to' in pieceList
function makeMove(from, to, pieceList) {
	pieceList[to] = pieceList[from];
	pieceList[from] = "Empty";
	
	return pieceList;
}

function otherColor(color) {
	if (color == "white") {
		return "black";
	} else {
		return "white";
	}
}

// returns true is 'turn's king is in immediate danger
function inCheck(pieceList, turn) {
	
	// find king
	let kingPos;
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i] == (turn + "-king") ) {
			kingPos = i;
			break;
		}
	}
	
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i].includes(otherColor(turn))) {
			let possibleMoves = getPossbleMoves(i, pieceList, otherColor(turn));
			if (possibleMoves.includes(kingPos)) {
				return true;
			}
		}
	}
	
	
	return false;
	
}

// Checks for win conditions (i.e win, loss, draw)
function isEndOfGame(pieceList, turn) {
	let kingInCheck = inCheck(pieceList, turn);
	
	let anyLegalMoves = false;
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i].includes(turn)) {
			if (getLegalMoves(i, pieceList, turn) != 0) {
				anyLegalMoves = true;
				break;
			}
		}
	}
	
	let onlyKingsLeft = true;
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i].includes("knight") || pieceList[i].includes("rook")) {
			onlyKingsLeft = false;
			break;
		}
	}
	
	if (onlyKingsLeft) {
		return {
			"winner" : "draw", 
			"reason" : "insufficient material"
		}
	}
	
	if (threefoldRep){
		return {
			"winner" : "draw", 
			"reason" : "3-fold repetition"
		}
	}
	
	if (anyLegalMoves) {
		return {
			"winner" : "none"
		}
	}
	
	if (kingInCheck && !anyLegalMoves) {
		return {
			"winner" : otherColor(turn), 
			"reason" : "checkmate"
		}
	}
	
	if (!kingInCheck && !anyLegalMoves) {
		return {
			"winner" : "draw", 
			"reason" : "stalemate"
		}
	}
	
	
	
}

function drawEndScreen(gameState) {
	const backgroundColour = "rgba(0, 0, 0, 0.5)";
	const textColor = "rgb(255, 255, 255)";
	const buttonColor = "#5a5b5d";
	
	// draw: background
	ctx.fillStyle = backgroundColour;
	ctx.fillRect(0, 0, 800, 100);
	
	// draw: win text
	ctx.fillStyle = textColor;
	ctx.textAlign = "center";
	ctx.font = "40px Arial";
	ctx.textBaseline = "middle";
	let script;
	switch (gameState["winner"]){
		case "white":
			script = "White wins";
			break;
		case "black":
			script = "Black wins";
			break;
		case "draw":
			script = "Draw";
			break;
	}
	script += " by " + gameState["reason"] + "!";
	ctx.fillText(script, 400, 30);
	
	// draw: 'play again' button
	
	ctx.fillStyle = buttonColor;
	roundRect(ctx, 325, 55, 150, 30, 5, true, false);
	
	ctx.fillStyle = textColor;
	ctx.font = "25px sans-sarif";
	ctx.fillText("Play again?", 400, 70);
	
}

// Keeps track of number of times every position has been seen
function recordPosition(pieceList) {
	
	let hash = '';
	pieceList.forEach( function(piece) {
		switch (piece) {
			case "white-king":
				hash += "K";
				break;
			case "white-knight":
				hash += "N";
				break;
			case "white-rook":
				hash += "R";
				break;
			case "Empty":
				hash += " ";
				break;
			case "black-rook":
				hash += "o";
				break;
			case "black-knight":
				hash += "t";
				break;
			case "black-king":
				hash += "g";
				break;
		}
	});
	
	if (Object.keys(positionsSeen).includes(hash)) {
		positionsSeen[hash] += 1
		if (positionsSeen[hash] == 3) {
			threefoldRep = true;
		}
	} else {
		positionsSeen[hash] = 1;
	}
}
	

$(window).ready(function(){

	// set global vars.
	canvas = $("#chess-canvas");
	ctx = canvas.get(0).getContext("2d");
	pieces = getImagesfromDom();
	
	let turn, selectedTile, legalMoves, gameState, pieceList;
	
	initGame = function() {
		// init vars
		turn = "white";
		selectedTile = -1;
		legalMoves = [];
		gameState = {"winner" : "none"};
		positionsSeen = {"knr otg" : 1};
		threefoldRep = false;
		
		//init board
		pieceList = ["white-king", "white-knight", "white-rook", "Empty", "Empty", "black-rook", "black-knight", "black-king"];
		drawBoard(ctx, pieceList, selectedTile);
	};
	
	initGame();

	// 'mouesdown on board' event handler
	$("#chess-canvas").mousedown(function(e) {
		if (gameState["winner"] != "none"){
			posClicked = getCursorPosition(e);
			if (325 <= posClicked[0] && posClicked[0] <= 475 &&
			    55 <= posClicked[1] && posClicked[1] <= 85) {
					
				//reset game
				initGame();
			}
			return;
		}
		
		let tileClicked = getTileFromClick(e);
		
		if (selectedTile == -1) { // No Selection:
			if (pieceList[tileClicked].includes(turn)) {
				selectedTile = tileClicked;
				legalMoves = getLegalMoves(selectedTile, pieceList, turn);
				drawBoard(ctx, pieceList, selectedTile, legalMoves);
			}
		} else { // Piece Selected:
			if (legalMoves.includes(tileClicked)) {
				makeMove(selectedTile, tileClicked, pieceList);
				recordPosition(pieceList);
				
				selectedTile = -1;
				drawBoard(ctx, pieceList, selectedTile);	
				// END OF TURN
				turn = otherColor(turn)
				
				// Check for winner/loser/draw
				gameState = isEndOfGame(pieceList, turn);
				if (gameState["winner"] != "none"){
					// Game is over
					drawEndScreen(gameState);
					return;					
				}
			} 
			// unselect the piece
			legalMoves = [];
			selectedTile = -1;
			drawBoard(ctx, pieceList, selectedTile, legalMoves);	
		}
	});	
	
});