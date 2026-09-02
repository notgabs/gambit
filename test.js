"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fen_1 = require("./src/lib/chess/fen");
var movegen_1 = require("./src/lib/chess/movegen");
var state = (0, fen_1.parseFEN)('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
state.turn = 'b';
var moves = (0, movegen_1.generateLegalMoves)(state);
var d7 = moves.filter(function (m) { return m.from === 51; });
console.log('d7 moves:', d7);
