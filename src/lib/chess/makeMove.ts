import { GameState, Move, MoveResult, Piece, PieceType } from './types';
import { getFile, getRank } from './attacks';
import { stateHash } from './hash';

export function makeMove(state: GameState, move: Move): MoveResult {
  const currentHash = stateHash(state);
  const newHistory = [...(state.history || []), currentHash];

  const newState: GameState = {
    board: [...state.board],
    turn: state.turn === 'w' ? 'b' : 'w',
    castling: {
      w: { ...state.castling.w },
      b: { ...state.castling.b },
    },
    enPassant: null,
    halfMoveClock: state.halfMoveClock + 1,
    fullMoveNumber: state.turn === 'b' ? state.fullMoveNumber + 1 : state.fullMoveNumber,
    history: newHistory,
  };

  const piece = state.board[move.from];
  if (!piece) throw new Error('No piece at source square');

  let captured = state.board[move.to] || undefined;
  let isEnPassant = false;
  let isPromotion = false;
  let isCastling = false;

  // En Passant capture
  if (piece.type === 'p' && move.to === state.enPassant) {
    const captureSq = state.turn === 'w' ? move.to - 8 : move.to + 8;
    captured = newState.board[captureSq] || undefined;
    newState.board[captureSq] = null;
    isEnPassant = true;
  }

  // Update half-move clock
  if (piece.type === 'p' || captured) {
    newState.halfMoveClock = 0;
  }

  // En Passant target square
  if (piece.type === 'p' && Math.abs(getRank(move.from) - getRank(move.to)) === 2) {
    newState.enPassant = state.turn === 'w' ? move.from + 8 : move.from - 8;
  }

  // Move the piece
  newState.board[move.to] = piece;
  newState.board[move.from] = null;

  // Promotion
  if (piece.type === 'p') {
    const r = getRank(move.to);
    if (r === 0 || r === 7) {
      isPromotion = true;
      newState.board[move.to] = { type: move.promotion || 'q', color: state.turn };
    }
  }

  // Castling
  if (piece.type === 'k') {
    const fDiff = getFile(move.to) - getFile(move.from);
    if (Math.abs(fDiff) === 2) {
      isCastling = true;
      const r = getRank(move.to);
      if (fDiff > 0) {
        // Kingside
        newState.board[r * 8 + 5] = newState.board[r * 8 + 7];
        newState.board[r * 8 + 7] = null;
      } else {
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
  const revokeCastling = (sq: number) => {
    if (sq === 0) newState.castling.w.q = false; // a1
    else if (sq === 7) newState.castling.w.k = false; // h1
    else if (sq === 56) newState.castling.b.q = false; // a8
    else if (sq === 63) newState.castling.b.k = false; // h8
  };
  revokeCastling(move.from);
  revokeCastling(move.to);

  return { newState, captured, isEnPassant, isPromotion, isCastling };
}

