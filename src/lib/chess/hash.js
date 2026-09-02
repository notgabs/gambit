"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateHash = stateHash;
// Simple seeded PRNG to ensure reproducibility
var PRNG = /** @class */ (function () {
    function PRNG(seed) {
        this.seed = seed;
    }
    PRNG.prototype.next = function () {
        // xorshift32ish
        this.seed ^= this.seed << 13;
        this.seed ^= this.seed >>> 17;
        this.seed ^= this.seed << 5;
        return this.seed >>> 0;
    };
    return PRNG;
}());
var prng = new PRNG(12345);
var ZOBRIST = {
    pieces: {}, // piece string -> 64 numbers
    turn: prng.next(),
    castling: {
        w: { k: prng.next(), q: prng.next() },
        b: { k: prng.next(), q: prng.next() }
    },
    enPassant: []
};
var pieceTypes = ['p', 'n', 'b', 'r', 'q', 'k'];
var colors = ['w', 'b'];
for (var _i = 0, colors_1 = colors; _i < colors_1.length; _i++) {
    var c = colors_1[_i];
    for (var _a = 0, pieceTypes_1 = pieceTypes; _a < pieceTypes_1.length; _a++) {
        var t = pieceTypes_1[_a];
        var key = c + t;
        ZOBRIST.pieces[key] = [];
        for (var i = 0; i < 64; i++) {
            ZOBRIST.pieces[key].push(prng.next());
        }
    }
}
for (var i = 0; i < 64; i++) {
    ZOBRIST.enPassant.push(prng.next());
}
function stateHash(state) {
    var hash = 0;
    for (var i = 0; i < 64; i++) {
        var p = state.board[i];
        if (p) {
            hash ^= ZOBRIST.pieces[p.color + p.type][i];
        }
    }
    if (state.turn === 'w') {
        hash ^= ZOBRIST.turn;
    }
    if (state.castling.w.k)
        hash ^= ZOBRIST.castling.w.k;
    if (state.castling.w.q)
        hash ^= ZOBRIST.castling.w.q;
    if (state.castling.b.k)
        hash ^= ZOBRIST.castling.b.k;
    if (state.castling.b.q)
        hash ^= ZOBRIST.castling.b.q;
    if (state.enPassant !== null) {
        hash ^= ZOBRIST.enPassant[state.enPassant];
    }
    return hash >>> 0; // ensure unsigned 32-bit
}
