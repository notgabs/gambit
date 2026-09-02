"use strict";
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
exports.opposite = opposite;
exports.isOnBoard = isOnBoard;
exports.getRank = getRank;
exports.getFile = getFile;
exports.isSquareAttacked = isSquareAttacked;
function opposite(color) {
    return color === 'w' ? 'b' : 'w';
}
function isOnBoard(sq) {
    return sq >= 0 && sq < 64;
}
function getRank(sq) {
    return Math.floor(sq / 8);
}
function getFile(sq) {
    return sq % 8;
}
var KNIGHT_OFFSETS = [15, 17, 6, 10, -15, -17, -6, -10];
var BISHOP_OFFSETS = [7, 9, -7, -9];
var ROOK_OFFSETS = [8, 1, -8, -1];
var QUEEN_OFFSETS = __spreadArray(__spreadArray([], BISHOP_OFFSETS, true), ROOK_OFFSETS, true);
var KING_OFFSETS = QUEEN_OFFSETS;
function isSquareAttackedByDirection(board, sq, color, offsets, isRay) {
    var r = getRank(sq);
    var f = getFile(sq);
    for (var _i = 0, offsets_1 = offsets; _i < offsets_1.length; _i++) {
        var offset = offsets_1[_i];
        var currentSq = sq;
        var cr = r;
        var cf = f;
        while (true) {
            currentSq += offset;
            if (!isOnBoard(currentSq))
                break;
            var nr = getRank(currentSq);
            var nf = getFile(currentSq);
            if (Math.abs(nr - cr) > 1 || Math.abs(nf - cf) > 1)
                break; // Wrapped around
            var piece = board[currentSq];
            if (piece) {
                if (piece.color === color) {
                    var type = piece.type;
                    if (isRay) {
                        if ((type === 'q') ||
                            (type === 'r' && (offset === 1 || offset === -1 || offset === 8 || offset === -8)) ||
                            (type === 'b' && (offset === 7 || offset === 9 || offset === -7 || offset === -9))) {
                            return true;
                        }
                    }
                    else {
                        if (type === 'k')
                            return true;
                    }
                }
                break;
            }
            if (!isRay)
                break;
            cr = nr;
            cf = nf;
        }
    }
    return false;
}
function isSquareAttacked(state, sq, color) {
    var board = state.board;
    var r = getRank(sq);
    var f = getFile(sq);
    // Pawn attacks
    var pawnDir = color === 'w' ? -1 : 1;
    var pawnRank = r + pawnDir;
    if (pawnRank >= 0 && pawnRank < 8) {
        if (f > 0) {
            var p = board[pawnRank * 8 + (f - 1)];
            if (p && p.color === color && p.type === 'p')
                return true;
        }
        if (f < 7) {
            var p = board[pawnRank * 8 + (f + 1)];
            if (p && p.color === color && p.type === 'p')
                return true;
        }
    }
    // Knight attacks
    for (var _i = 0, KNIGHT_OFFSETS_1 = KNIGHT_OFFSETS; _i < KNIGHT_OFFSETS_1.length; _i++) {
        var offset = KNIGHT_OFFSETS_1[_i];
        var targetSq = sq + offset;
        if (isOnBoard(targetSq)) {
            var tr = getRank(targetSq);
            var tf = getFile(targetSq);
            if (Math.abs(tr - r) <= 2 && Math.abs(tf - f) <= 2) {
                var p = board[targetSq];
                if (p && p.color === color && p.type === 'n')
                    return true;
            }
        }
    }
    // Rays (Rook, Bishop, Queen) and King
    if (isSquareAttackedByDirection(board, sq, color, QUEEN_OFFSETS, true))
        return true;
    if (isSquareAttackedByDirection(board, sq, color, KING_OFFSETS, false))
        return true;
    return false;
}
