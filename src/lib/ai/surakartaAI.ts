import type { SurakartaState, SurakartaMove, SurakartaPlayer } from '@/types/surakarta';
import { toFlat, generateMovesFlat, countMobility, DRAW_PLIES } from '../engine/surakarta';

const WIN = 10000;

/** Bônus de centralidade por casa (0–4), pré-computado. */
const CENTER = new Int8Array(36);
for (let i = 0; i < 36; i++) {
  const x = i % 6, y = (i / 6) | 0;
  const cx = x === 2 || x === 3 ? 2 : x === 1 || x === 4 ? 1 : 0;
  const cy = y === 2 || y === 3 ? 2 : y === 1 || y === 4 ? 1 : 0;
  CENTER[i] = cx + cy;
}

interface Counts {
  p1: number;
  p2: number;
}

const idx = (x: number, y: number) => y * 6 + x;

function make(board: Int8Array, m: SurakartaMove, turn: SurakartaPlayer, c: Counts) {
  if (m.isCapture) {
    board[idx(m.capturedX!, m.capturedY!)] = 0;
    if (turn === 1) c.p2--; else c.p1--;
  }
  board[idx(m.toX, m.toY)] = turn;
  board[idx(m.fromX, m.fromY)] = 0;
}

function unmake(board: Int8Array, m: SurakartaMove, turn: SurakartaPlayer, c: Counts) {
  board[idx(m.fromX, m.fromY)] = turn;
  board[idx(m.toX, m.toY)] = 0;
  if (m.isCapture) {
    board[idx(m.capturedX!, m.capturedY!)] = -turn as SurakartaPlayer;
    if (turn === 1) c.p2++; else c.p1++;
  }
}

/** Capturas primeiro, in-place, sem comparador. */
function orderMoves(moves: SurakartaMove[]) {
  let j = 0;
  for (let i = 0; i < moves.length; i++) {
    if (moves[i].isCapture) {
      const t = moves[i]; moves[i] = moves[j]; moves[j] = t;
      j++;
    }
  }
}

/** Avaliação estática do ponto de vista de `turn`. Sempre inteira. */
function evaluate(board: Int8Array, turn: SurakartaPlayer): number {
  let s = 0;
  for (let i = 0; i < 36; i++) {
    const p = board[i];
    if (p === 0) continue;
    const v = 100 + CENTER[i];
    s += p === turn ? v : -v;
  }
  const my = countMobility(board, turn);
  const en = countMobility(board, -turn as SurakartaPlayer);
  return s + my.n + my.caps * 10 - en.n - en.caps * 10;
}

function negamax(
  board: Int8Array,
  turn: SurakartaPlayer,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  pliesNoCapture: number,
  c: Counts,
): number {
  const mine = turn === 1 ? c.p1 : c.p2;
  const theirs = turn === 1 ? c.p2 : c.p1;
  if (mine === 0) return -(WIN - ply);
  if (theirs === 0) return WIN - ply;
  if (pliesNoCapture >= DRAW_PLIES) return 0;
  if (depth === 0) return evaluate(board, turn);

  const moves = generateMovesFlat(board, turn);
  if (moves.length === 0) return -(WIN - ply);
  orderMoves(moves);

  const opp = -turn as SurakartaPlayer;
  let best = -Infinity;

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    make(board, m, turn, c);
    const v = -negamax(board, opp, depth - 1, -beta, -alpha, ply + 1, m.isCapture ? 0 : pliesNoCapture + 1, c);
    unmake(board, m, turn, c);

    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

export function getBestMoveSurakarta(state: SurakartaState, depth: number): SurakartaMove | null {
  const board = toFlat(state.board);
  const me = state.turn;
  const opp = -me as SurakartaPlayer;

  const moves = generateMovesFlat(board, me);
  if (moves.length === 0) return null;
  orderMoves(moves);

  const c: Counts = { p1: 0, p2: 0 };
  for (let i = 0; i < 36; i++) {
    if (board[i] === 1) c.p1++;
    else if (board[i] === -1) c.p2++;
  }

  let best = -Infinity;
  const ties: SurakartaMove[] = [];

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const plies = m.isCapture ? 0 : state.pliesWithoutCapture + 1;

    make(board, m, me, c);
    let v = -negamax(board, opp, depth - 1, -Infinity, -best, 1, plies, c);

    // Com alpha-beta, v === best pode ser apenas um limite superior. Re-busca com
    // janela aberta em 1 para obter o valor exato antes de tratar como empate.
    if (v === best && best !== -Infinity) {
      v = -negamax(board, opp, depth - 1, -Infinity, -best + 1, 1, plies, c);
    }
    unmake(board, m, me, c);

    if (v > best) {
      best = v;
      ties.length = 0;
      ties.push(m);
    } else if (v === best) {
      ties.push(m);
    }
  }

  return ties[Math.floor(Math.random() * ties.length)] ?? null;
}
