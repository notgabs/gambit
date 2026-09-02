import { GameState, Color, Square } from './types';

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

export function isOnBoard(sq: Square): boolean {
  return sq >= 0 && sq < 64;
}

export function getRank(sq: Square): number {
  return Math.floor(sq / 8);
}

export function getFile(sq: Square): number {
  return sq % 8;
}

const KNIGHT_OFFSETS = [15, 17, 6, 10, -15, -17, -6, -10];
const BISHOP_OFFSETS = [7, 9, -7, -9];
const ROOK_OFFSETS = [8, 1, -8, -1];
const QUEEN_OFFSETS = [...BISHOP_OFFSETS, ...ROOK_OFFSETS];
const KING_OFFSETS = QUEEN_OFFSETS;

function isSquareAttackedByDirection(
  board: GameState['board'],
  sq: Square,
  color: Color,
  offsets: number[],
  isRay: boolean
): boolean {
  const r = getRank(sq);
  const f = getFile(sq);

  for (const offset of offsets) {
    let currentSq = sq;
    let cr = r;
    let cf = f;

    while (true) {
      currentSq += offset;
      if (!isOnBoard(currentSq)) break;

      const nr = getRank(currentSq);
      const nf = getFile(currentSq);
      if (Math.abs(nr - cr) > 1 || Math.abs(nf - cf) > 1) break; // Wrapped around

      const piece = board[currentSq];
      if (piece) {
        if (piece.color === color) {
          const type = piece.type;
          if (isRay) {
            if (
              (type === 'q') ||
              (type === 'r' && (offset === 1 || offset === -1 || offset === 8 || offset === -8)) ||
              (type === 'b' && (offset === 7 || offset === 9 || offset === -7 || offset === -9))
            ) {
              return true;
            }
          } else {
            if (type === 'k') return true;
          }
        }
        break;
      }

      if (!isRay) break;
      cr = nr;
      cf = nf;
    }
  }
  return false;
}

export function isSquareAttacked(state: GameState, sq: Square, color: Color): boolean {
  const board = state.board;
  const r = getRank(sq);
  const f = getFile(sq);

  // Pawn attacks
  const pawnDir = color === 'w' ? -1 : 1;
  const pawnRank = r + pawnDir;
  if (pawnRank >= 0 && pawnRank < 8) {
    if (f > 0) {
      const p = board[pawnRank * 8 + (f - 1)];
      if (p && p.color === color && p.type === 'p') return true;
    }
    if (f < 7) {
      const p = board[pawnRank * 8 + (f + 1)];
      if (p && p.color === color && p.type === 'p') return true;
    }
  }

  // Knight attacks
  for (const offset of KNIGHT_OFFSETS) {
    const targetSq = sq + offset;
    if (isOnBoard(targetSq)) {
      const tr = getRank(targetSq);
      const tf = getFile(targetSq);
      if (Math.abs(tr - r) <= 2 && Math.abs(tf - f) <= 2) {
        const p = board[targetSq];
        if (p && p.color === color && p.type === 'n') return true;
      }
    }
  }

  // Rays (Rook, Bishop, Queen) and King
  if (isSquareAttackedByDirection(board, sq, color, QUEEN_OFFSETS, true)) return true;
  if (isSquareAttackedByDirection(board, sq, color, KING_OFFSETS, false)) return true;

  return false;
}
