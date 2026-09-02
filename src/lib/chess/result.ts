import { GameState, Color, Move } from './types';
import { generateLegalMoves } from './movegen';
import { isSquareAttacked, opposite } from './attacks';
import { stateHash } from './hash';

export function isInsufficientMaterial(state: GameState): boolean {
  const pieces = {
    w: { n: 0, b: 0, r: 0, q: 0, p: 0, b_sq: [] as number[] },
    b: { n: 0, b: 0, r: 0, q: 0, p: 0, b_sq: [] as number[] }
  };

  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p) {
      if (p.type === 'k') continue;
      if (p.type === 'p') pieces[p.color].p++;
      if (p.type === 'n') pieces[p.color].n++;
      if (p.type === 'b') {
        pieces[p.color].b++;
        pieces[p.color].b_sq.push(i);
      }
      if (p.type === 'r') pieces[p.color].r++;
      if (p.type === 'q') pieces[p.color].q++;
    }
  }

  if (
    pieces.w.p > 0 || pieces.b.p > 0 ||
    pieces.w.r > 0 || pieces.b.r > 0 ||
    pieces.w.q > 0 || pieces.b.q > 0
  ) {
    return false;
  }

  if (pieces.w.n === 0 && pieces.w.b === 0 && pieces.b.n === 0 && pieces.b.b === 0) {
    return true;
  }

  const wPieces = pieces.w.n + pieces.w.b;
  const bPieces = pieces.b.n + pieces.b.b;

  if ((wPieces === 1 && bPieces === 0) || (wPieces === 0 && bPieces === 1)) {
    return true;
  }

  if (pieces.w.b === 1 && pieces.b.b === 1 && pieces.w.n === 0 && pieces.b.n === 0) {
    const wSquareColor = (Math.floor(pieces.w.b_sq[0] / 8) + (pieces.w.b_sq[0] % 8)) % 2;
    const bSquareColor = (Math.floor(pieces.b.b_sq[0] / 8) + (pieces.b.b_sq[0] % 8)) % 2;
    if (wSquareColor === bSquareColor) {
      return true;
    }
  }

  return false;
}

export type GameResult = '*' | '1-0' | '0-1' | '1/2-1/2';

/**
 * @param legalMoves - opcional. Se já foram calculados (ex: dentro da IA),
 * passe aqui para evitar recalcular generateLegalMoves de novo.
 */
export function getResult(state: GameState, legalMoves?: Move[]): GameResult {
  const legal = legalMoves ?? generateLegalMoves(state);
  const opp = opposite(state.turn);
  let kingSq = -1;
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p && p.type === 'k' && p.color === state.turn) {
      kingSq = i;
      break;
    }
  }

  const isCheck = kingSq !== -1 && isSquareAttacked(state, kingSq, opp);

  if (legal.length === 0) {
    if (isCheck) {
      return state.turn === 'w' ? '0-1' : '1-0';
    }
    return '1/2-1/2'; // Afogamento (Stalemate)
  }

  if (state.halfMoveClock >= 100) {
    return '1/2-1/2'; // Regra dos 50 lances
  }

  if (isInsufficientMaterial(state)) {
    return '1/2-1/2';
  }

  if (state.history) {
    const currentHash = stateHash(state);
    let count = 1;
    for (const h of state.history) {
      if (h === currentHash) count++;
    }
    if (count >= 3) return '1/2-1/2'; // Repetição tripla
  }

  return '*';
}
