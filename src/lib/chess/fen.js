"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFEN = parseFEN;
exports.toFEN = toFEN;
function parseFEN(fen) {
    var parts = fen.trim().split(/\s+/);
    if (parts.length !== 6)
        throw new Error('Invalid FEN');
    var boardFen = parts[0], turnFen = parts[1], castlingFen = parts[2], epFen = parts[3], halfMoveFen = parts[4], fullMoveFen = parts[5];
    var board = new Array(64).fill(null);
    var rows = boardFen.split('/');
    if (rows.length !== 8)
        throw new Error('Invalid FEN board');
    for (var r = 0; r < 8; r++) {
        var rank = 7 - r; // FEN starts at rank 8
        var f = 0;
        for (var _i = 0, _a = rows[r]; _i < _a.length; _i++) {
            var char = _a[_i];
            if (/\d/.test(char)) {
                f += parseInt(char, 10);
            }
            else {
                var type = char.toLowerCase();
                var color = char === char.toUpperCase() ? 'w' : 'b';
                board[rank * 8 + f] = { type: type, color: color };
                f++;
            }
        }
    }
    var turn = turnFen === 'w' ? 'w' : 'b';
    var castling = {
        w: { k: castlingFen.includes('K'), q: castlingFen.includes('Q') },
        b: { k: castlingFen.includes('k'), q: castlingFen.includes('q') }
    };
    var enPassant = null;
    if (epFen !== '-') {
        var file = epFen.charCodeAt(0) - 'a'.charCodeAt(0);
        var rank = epFen.charCodeAt(1) - '1'.charCodeAt(0);
        enPassant = rank * 8 + file;
    }
    var halfMoveClock = parseInt(halfMoveFen, 10);
    var fullMoveNumber = parseInt(fullMoveFen, 10);
    return { board: board, turn: turn, castling: castling, enPassant: enPassant, halfMoveClock: halfMoveClock, fullMoveNumber: fullMoveNumber };
}
function toFEN(state) {
    var fen = '';
    for (var r = 7; r >= 0; r--) {
        var empty = 0;
        for (var f = 0; f < 8; f++) {
            var piece = state.board[r * 8 + f];
            if (!piece) {
                empty++;
            }
            else {
                if (empty > 0) {
                    fen += empty;
                    empty = 0;
                }
                fen += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
            }
        }
        if (empty > 0)
            fen += empty;
        if (r > 0)
            fen += '/';
    }
    fen += ' ' + state.turn + ' ';
    var castling = '';
    if (state.castling.w.k)
        castling += 'K';
    if (state.castling.w.q)
        castling += 'Q';
    if (state.castling.b.k)
        castling += 'k';
    if (state.castling.b.q)
        castling += 'q';
    if (castling === '')
        castling = '-';
    fen += castling + ' ';
    if (state.enPassant === null) {
        fen += '-';
    }
    else {
        var file = String.fromCharCode('a'.charCodeAt(0) + (state.enPassant % 8));
        var rank = String.fromCharCode('1'.charCodeAt(0) + Math.floor(state.enPassant / 8));
        fen += file + rank;
    }
    fen += ' ' + state.halfMoveClock + ' ' + state.fullMoveNumber;
    return fen;
}
