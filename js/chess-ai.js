function tostr(sdf) {
	hash = "[";
	sdf.forEach( function(piece) {
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
				hash += "_";
				break;
			case "black-rook":
				hash += "r";
				break;
			case "black-knight":
				hash += "n";
				break;
			case "black-king":
				hash += "k";
				break;
		}
	});
	hash += "]"
	return hash;
}

function anyRooks(pieceList){
	let numPieces = 0;
	for (let i = 0; i < pieceList.length; i++) {
		if (!pieceList[i].includes("Rook")) {
			return true;
		}
	}
	return false;
}

// Gets the best move for the given board position, given it's 'turn's turn
function getBestMove(gameState) {
	console.log("Finding bestmove");
	
	
	gameState["noRooks"] = 0;
	
	console.log("score: " + minimax(gameState))
	console.log(gameState);
	console.log(gameState.bestMove);
}

function minimax(gameState, a=-1, b=1, depth=0) {
	if (depth == 15) {
		//console.log("reached max depth");
		return 0;
	}
	gameState["gameResult"] = isEndOfGame(gameState["pieceList"], gameState["turn"], gameState["threefoldRep"])
	if (gameState["gameResult"]["winner"] != "none") {
		//console.log("terminal node: " + gameState["gameResult"]["winner"] + " won by " + gameState["gameResult"]["reason"] + "at depth" + gameState["depth"]);
		switch (gameState["gameResult"]["winner"]){
			case "white":
				//console.log("white win");
				return 1;
			case "black":
				//console.log("black win");
				return -1 
			case "draw":
				return 0;
		}
	}
	if (canClaimDraw(gameState["pieceList"])) {
		//console.log("1 knights draw");
		return 0;
	}
	if (! anyRooks(gameState["pieceList"])) {
		gameState["noRooks"] += 1;
		if (gameState["noRooks"] == 3) {
			//console.log("2 knights draw");
			return 0;
		}
	}
	//console.log("Turn of: " + gameState.turn);
	let value;
	if (gameState["turn"] == "white") { // Maximizing player
		value = -Infinity;
		// Find all legal moves
		let kingMoves = [];
		let captureMoves = [];
		let otherLegalMoves = [];
		for (let i = 0; i < gameState["pieceList"].length; i++) {
			if (gameState["pieceList"][i].includes(gameState["turn"])) {
				
				getLegalMoves(i, gameState["pieceList"], gameState["turn"]).forEach(function(endPos) {
					//TODO: priorizitze checking moves
					if (gameState["pieceList"][endPos] != "Empty") {
						captureMoves.push([i, endPos]);
					} else if (gameState["pieceList"][i] == "white-king") {
						kingMoves.push([i, endPos]);
					} else {
						otherLegalMoves.push([i, endPos]);
					}
				});
			}
		}
		let allLegalMoves = captureMoves.concat(otherLegalMoves.concat(kingMoves));
		//console.log("white's legal moves: " + JSON.parse(JSON.stringify(allLegalMoves)))
		//console.log(allLegalMoves);
		//console.log("\n\n" + JSON.parse(JSON.stringify(allLegalMoves)))
		//console.log(JSON.parse(JSON.stringify(kingMoves)) + " : " +  JSON.parse(JSON.stringify(captureMoves)) + " : " + JSON.parse(JSON.stringify(otherLegalMoves)))
		
		////console.log("maximizing");
		//console.log(tostr(gameState["pieceList"]) + " : " + gameState["turn"]);
		////console.log(gameState["positionsSeen"])
		
		for (let i = 0; i < allLegalMoves.length; i++) {
			let movePair = allLegalMoves[i];
			//create gameState for child position
			let childGameState = $.extend(true, {}, gameState) //clone gameState into childGameState
			makeMove(movePair[0], movePair[1], childGameState["pieceList"]);
			childGameState["threefoldRep"] = recordPosition(childGameState["pieceList"], childGameState["positionsSeen"], childGameState["threefoldRep"]);
			childGameState["turn"] = otherColor(childGameState["turn"]);
			childGameState["depth"] = gameState["depth"] + 1;
			
			//console.log("next states turn: " + JSON.parse(JSON.stringify(childGameState["turn"])));
			//console.log("next states board: " + JSON.parse(JSON.stringify(tostr(childGameState["pieceList"]))));
			//console.log());
			//console.log("3fold: " + JSON.parse(JSON.stringify(childGameState["threefoldRep"])));
			//console.log(JSON.parse(JSON.stringify(childGameState["positionsSeen"])));
			
			let childValue = minimax(childGameState, a, b, depth+1)
			value = Math.max(value, childValue);
			if (value == childValue) {
				gameState["bestMove"] = movePair;
			}
			a = Math.max(a, value);
			if (a >= b) {
				break;
			}
			
		}
		return value;
	} else { // Minimizing player
		value = Infinity;
		// Find all legal moves
		let kingMoves = [];
		let captureMoves = [];
		let otherLegalMoves = [];
		for (let i = 0; i < gameState["pieceList"].length; i++) {
			if (gameState["pieceList"][i].includes(gameState["turn"])) {
				
				getLegalMoves(i, gameState["pieceList"], gameState["turn"]).forEach(function(endPos) {
					if (gameState["pieceList"][endPos] != "Empty") {
						captureMoves.push([i, endPos]);
					} else if (gameState["pieceList"][i] == "white-king") {
						kingMoves.push([i, endPos]);
					} else {
						otherLegalMoves.push([i, endPos]);
					}
				});
			}
		}
		let allLegalMoves = captureMoves.concat(otherLegalMoves.concat(kingMoves));
		
		//console.log("black's legal moves: " + JSON.parse(JSON.stringify(allLegalMoves)))
		////console.log("minimizing");
		//console.log(tostr(gameState["pieceList"]) + " : " + gameState["turn"]);
		
		for (let i = 0; i < allLegalMoves.length; i++) {
			let movePair = allLegalMoves[i];
			//create gameState for child position
			let childGameState = $.extend(true, {}, gameState) //clone gameState into childGameState
			makeMove(movePair[0], movePair[1], childGameState["pieceList"]);
			childGameState["threefoldRep"] = recordPosition(childGameState["pieceList"], childGameState["positionsSeen"], childGameState["threefoldRep"]);
			childGameState["turn"] = otherColor(childGameState["turn"]);
			
			//console.log("next states turn: " + JSON.parse(JSON.stringify(childGameState["turn"])));
			//console.log("next states board: " + JSON.parse(JSON.stringify(tostr(childGameState["pieceList"]))));
			//console.log("looking at: " + tostr(gameState["pieceList"]) + " --> " + tostr(childGameState["pieceList"]));
			//console.log(JSON.parse(JSON.stringify(childGameState["gameResult"])));
			//console.log(JSON.parse(JSON.stringify(childGameState["threefoldRep"])));
			//console.log(JSON.parse(JSON.stringify(childGameState["positionsSeen"])));
			
			let childValue = minimax(childGameState, a, b, depth+1)
			value = Math.min(value, childValue);
			if (value == childValue) {
				gameState["bestMove"] = movePair;
			}
			b = Math.max(b, value);
			if (b <= a){
				break;
			}
		}
		return value;
	}
}

