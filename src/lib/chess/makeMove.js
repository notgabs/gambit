"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMove = makeMove;
var attacks_1 = require("./attacks");
var hash_1 = require("./hash");
function makeMove(state, move) {
    var currentHash = (0, hash_1.stateHash)(state);
    var newHistory = __spreadArray(__spreadArray([], (state.history || []), true), [currentHash], false);
    var newState = {
        board: __spreadArray([], state.board, true),
        turn: state.turn === 'w' ? 'b' : 'w',
        castling: {
            w: __assign({}, state.castling.w),
            b: __assign({}, state.castling.b),
        },
        enPassant: null,
        halfMoveClock: state.halfMoveClock + 1,
        fullMoveNumber: state.turn === 'b' ? state.fullMoveNumber + 1 : state.fullMoveNumber,
        history: newHistory,
    };
    var piece = state.board[move.from];
    if (!piece)
        throw new Error('No piece at source square');
    var captured = state.board[move.to] || undefined;
    var isEnPassant = false;
    var isPromotion = false;
    var isCastling = false;
    // En Passant capture
    if (piece.type === 'p' && move.to === state.enPassant) {
        var captureSq = state.turn === 'w' ? move.to - 8 : move.to + 8;
        captured = newState.board[captureSq] || undefined;
        newState.board[captureSq] = null;
        isEnPassant = true;
    }
    // Update half-move clock
    if (piece.type === 'p' || captured) {
        newState.halfMoveClock = 0;
    }
    // En Passant target square
    if (piece.type === 'p' && Math.abs((0, attacks_1.getRank)(move.from) - (0, attacks_1.getRank)(move.to)) === 2) {
        newState.enPassant = state.turn === 'w' ? move.from + 8 : move.from - 8;
    }
    // Move the piece
    newState.board[move.to] = piece;
    newState.board[move.from] = null;
    // Promotion
    if (piece.type === 'p') {
        var r = (0, attacks_1.getRank)(move.to);
        if (r === 0 || r === 7) {
            isPromotion = true;
            newState.board[move.to] = { type: move.promotion || 'q', color: state.turn };
        }
    }
    // Castling
    if (piece.type === 'k') {
        var fDiff = (0, attacks_1.getFile)(move.to) - (0, attacks_1.getFile)(move.from);
        if (Math.abs(fDiff) === 2) {
            isCastling = true;
            var r = (0, attacks_1.getRank)(move.to);
            if (fDiff > 0) {
                // Kingside
                newState.board[r * 8 + 5] = newState.board[r * 8 + 7];
                newState.board[r * 8 + 7] = null;
            }
            else {
                // Queenside
                newState.board[r * 8 + 3] = newState.board[r * 8 + 0];
                newState.board[r * 8 + 0] = null;
            }
        }
        // Revoke castling rights
        newState.castling[state.turn].k = false;
        newState.castling[state.turn].q = false;
    }
    // Revoke castling rights on rook moves/captures
    var revokeCastling = function (sq) {
        if (sq === 0)
            newState.castling.w.q = false; // a1
        else if (sq === 7)
            newState.castling.w.k = false; // h1
        else if (sq === 56)
            newState.castling.b.q = false; // a8
        else if (sq === 63)
            newState.castling.b.k = false; // h8
    };
    revokeCastling(move.from);
    revokeCastling(move.to);
    return { newState: newState, captured: captured, isEnPassant: isEnPassant, isPromotion: isPromotion, isCastling: isCastling };
}
