import { GameState, Piece, Color, PieceType, Square } from './types';

export function parseFEN(fen: string): GameState {
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) throw new Error('Invalid FEN');

  const [boardFen, turnFen, castlingFen, epFen, halfMoveFen, fullMoveFen] = parts;

  const board: (Piece | null)[] = new Array(64).fill(null);
  const rows = boardFen.split('/');
  if (rows.length !== 8) throw new Error('Invalid FEN board');

  for (let r = 0; r < 8; r++) {
    const rank = 7 - r; // FEN starts at rank 8
    let f = 0;
    for (const char of rows[r]) {
      if (/\d/.test(char)) {
        f += parseInt(char, 10);
      } else {
        const type = char.toLowerCase() as PieceType;
        const color = char === char.toUpperCase() ? 'w' : 'b';
        board[rank * 8 + f] = { type, color };
        f++;
      }
    }
  }

  const turn: Color = turnFen === 'w' ? 'w' : 'b';

  const castling = {
    w: { k: castlingFen.includes('K'), q: castlingFen.includes('Q') },
    b: { k: castlingFen.includes('k'), q: castlingFen.includes('q') }
  };

  let enPassant: Square | null = null;
  if (epFen !== '-') {
    const file = epFen.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = epFen.charCodeAt(1) - '1'.charCodeAt(0);
    enPassant = rank * 8 + file;
  }

  const halfMoveClock = parseInt(halfMoveFen, 10);
  const fullMoveNumber = parseInt(fullMoveFen, 10);

  return { board, turn, castling, enPassant, halfMoveClock, fullMoveNumber };
}

export function toFEN(state: GameState): string {
  let fen = '';
  for (let r = 7; r >= 0; r--) {
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const piece = state.board[r * 8 + f];
      if (!piece) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
      }
    }
    if (empty > 0) fen += empty;
    if (r > 0) fen += '/';
  }

  fen += ' ' + state.turn + ' ';

  let castling = '';
  if (state.castling.w.k) castling += 'K';
  if (state.castling.w.q) castling += 'Q';
  if (state.castling.b.k) castling += 'k';
  if (state.castling.b.q) castling += 'q';
  if (castling === '') castling = '-';
  fen += castling + ' ';

  if (state.enPassant === null) {
    fen += '-';
  } else {
    const file = String.fromCharCode('a'.charCodeAt(0) + (state.enPassant % 8));
    const rank = String.fromCharCode('1'.charCodeAt(0) + Math.floor(state.enPassant / 8));
    fen += file + rank;
  }

  fen += ' ' + state.halfMoveClock + ' ' + state.fullMoveNumber;
  return fen;
}
