"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePseudoLegalMoves = generatePseudoLegalMoves;
exports.generateLegalMoves = generateLegalMoves;
var attacks_1 = require("./attacks");
var makeMove_1 = require("./makeMove");
function generatePseudoLegalMoves(state) {
    var moves = [];
    var color = state.turn;
    for (var sq = 0; sq < 64; sq++) {
        var piece = state.board[sq];
        if (!piece || piece.color !== color)
            continue;
        var r = (0, attacks_1.getRank)(sq);
        var f = (0, attacks_1.getFile)(sq);
        if (piece.type === 'p') {
            var dir = color === 'w' ? 1 : -1;
            var startRank = color === 'w' ? 1 : 6;
            var promRank = color === 'w' ? 7 : 0;
            // Single push
            var oneStep = sq + dir * 8;
            if ((0, attacks_1.isOnBoard)(oneStep) && !state.board[oneStep]) {
                addPawnMoves(moves, sq, oneStep, (0, attacks_1.getRank)(oneStep) === promRank);
                // Double push
                if (r === startRank) {
                    var twoStep = sq + dir * 16;
                    if (!state.board[twoStep]) {
                        moves.push({ from: sq, to: twoStep });
                    }
                }
            }
            // Captures
            for (var _i = 0, _a = [-1, 1]; _i < _a.length; _i++) {
                var fOff = _a[_i];
                if (f + fOff >= 0 && f + fOff < 8) {
                    var capSq = sq + dir * 8 + fOff;
                    if ((0, attacks_1.isOnBoard)(capSq)) {
                        var target = state.board[capSq];
                        if (target && target.color !== color) {
                            addPawnMoves(moves, sq, capSq, (0, attacks_1.getRank)(capSq) === promRank);
                        }
                        else if (capSq === state.enPassant) {
                            moves.push({ from: sq, to: capSq });
                        }
                    }
                }
            }
        }
        else if (piece.type === 'n') {
            var offsets = [15, 17, 6, 10, -15, -17, -6, -10];
            for (var _b = 0, offsets_1 = offsets; _b < offsets_1.length; _b++) {
                var off = offsets_1[_b];
                var target = sq + off;
                if ((0, attacks_1.isOnBoard)(target)) {
                    var tr = (0, attacks_1.getRank)(target);
                    var tf = (0, attacks_1.getFile)(target);
                    if (Math.abs(tr - r) <= 2 && Math.abs(tf - f) <= 2) {
                        var tPiece = state.board[target];
                        if (!tPiece || tPiece.color !== color) {
                            moves.push({ from: sq, to: target });
                        }
                    }
                }
            }
        }
        else if (piece.type === 'k') {
            var offsets = [8, 1, -8, -1, 7, 9, -7, -9];
            for (var _c = 0, offsets_2 = offsets; _c < offsets_2.length; _c++) {
                var off = offsets_2[_c];
                var target = sq + off;
                if ((0, attacks_1.isOnBoard)(target)) {
                    var tr = (0, attacks_1.getRank)(target);
                    var tf = (0, attacks_1.getFile)(target);
                    if (Math.abs(tr - r) <= 1 && Math.abs(tf - f) <= 1) {
                        var tPiece = state.board[target];
                        if (!tPiece || tPiece.color !== color) {
                            moves.push({ from: sq, to: target });
                        }
                    }
                }
            }
            // Castling
            var opp = (0, attacks_1.opposite)(color);
            var row = color === 'w' ? 0 : 7;
            if (sq === row * 8 + 4) { // King is at starting pos
                if (state.castling[color].k) {
                    if (!state.board[row * 8 + 5] && !state.board[row * 8 + 6]) {
                        if (!(0, attacks_1.isSquareAttacked)(state, sq, opp) &&
                            !(0, attacks_1.isSquareAttacked)(state, sq + 1, opp) &&
                            !(0, attacks_1.isSquareAttacked)(state, sq + 2, opp)) {
                            moves.push({ from: sq, to: sq + 2 });
                        }
                    }
                }
                if (state.castling[color].q) {
                    if (!state.board[row * 8 + 3] && !state.board[row * 8 + 2] && !state.board[row * 8 + 1]) {
                        if (!(0, attacks_1.isSquareAttacked)(state, sq, opp) &&
                            !(0, attacks_1.isSquareAttacked)(state, sq - 1, opp) &&
                            !(0, attacks_1.isSquareAttacked)(state, sq - 2, opp)) {
                            moves.push({ from: sq, to: sq - 2 });
                        }
                    }
                }
            }
        }
        else { // Bishop, Rook, Queen
            var dirs = [];
            if (piece.type === 'b' || piece.type === 'q')
                dirs.push(7, 9, -7, -9);
            if (piece.type === 'r' || piece.type === 'q')
                dirs.push(8, 1, -8, -1);
            for (var _d = 0, dirs_1 = dirs; _d < dirs_1.length; _d++) {
                var dir = dirs_1[_d];
                var currentSq = sq;
                var cr = r;
                var cf = f;
                while (true) {
                    currentSq += dir;
                    if (!(0, attacks_1.isOnBoard)(currentSq))
                        break;
                    var nr = (0, attacks_1.getRank)(currentSq);
                    var nf = (0, attacks_1.getFile)(currentSq);
                    if (Math.abs(nr - cr) > 1 || Math.abs(nf - cf) > 1)
                        break;
                    var tPiece = state.board[currentSq];
                    if (!tPiece) {
                        moves.push({ from: sq, to: currentSq });
                    }
                    else {
                        if (tPiece.color !== color) {
                            moves.push({ from: sq, to: currentSq });
                        }
                        break;
                    }
                    cr = nr;
                    cf = nf;
                }
            }
        }
    }
    return moves;
}
function addPawnMoves(moves, from, to, isPromotion) {
    if (isPromotion) {
        moves.push({ from: from, to: to, promotion: 'q' });
        moves.push({ from: from, to: to, promotion: 'r' });
        moves.push({ from: from, to: to, promotion: 'b' });
        moves.push({ from: from, to: to, promotion: 'n' });
    }
    else {
        moves.push({ from: from, to: to });
    }
}
function generateLegalMoves(state) {
    var pseudoMoves = generatePseudoLegalMoves(state);
    var legalMoves = [];
    var opp = (0, attacks_1.opposite)(state.turn);
    for (var _i = 0, pseudoMoves_1 = pseudoMoves; _i < pseudoMoves_1.length; _i++) {
        var move = pseudoMoves_1[_i];
        var newState = (0, makeMove_1.makeMove)(state, move).newState;
        // Find king square
        var kingSq = -1;
        for (var i = 0; i < 64; i++) {
            var p = newState.board[i];
            if (p && p.type === 'k' && p.color === state.turn) {
                kingSq = i;
                break;
            }
        }
        if (kingSq !== -1 && !(0, attacks_1.isSquareAttacked)(newState, kingSq, opp)) {
            legalMoves.push(move);
        }
    }
    return legalMoves;
}
