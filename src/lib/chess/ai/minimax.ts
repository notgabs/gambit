import { GameState, Move, Color, PieceType } from '@/lib/chess/types';
import { generateLegalMoves } from '@/lib/chess/movegen';
import { makeMove } from '@/lib/chess/makeMove';
import { stateHash } from '@/lib/chess/hash';
import { getResult } from '@/lib/chess/result';

const PIECE_VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Piece-Square Tables — convenção: linha 0 = rank 8, linha 7 = rank 1 (visão padrão)
const PST: Record<string, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

function pstValue(type: PieceType, sq: number, color: Color): number {
  const table = PST[type];
  if (!table) return 0;
  const rank = Math.floor(sq / 8); // 0 = rank1 ... 7 = rank8
  const file = sq % 8;
  const idx = color === 'w' ? (7 - rank) * 8 + file : rank * 8 + file;
  return table[idx];
}

function evaluate(state: GameState, perspective: Color, legalForTurn: Move[]): number {
  let score = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = state.board[sq];
    if (!p) continue;
    const sign = p.color === perspective ? 1 : -1;
    score += sign * (PIECE_VALUES[p.type] + pstValue(p.type, sq, p.color));
  }

  // Mobilidade do lado que tem a vez neste nó
  const mobilitySign = perspective === state.turn ? 1 : -1;
  score += mobilitySign * legalForTurn.length * 2;

  return score;
}

type TTFlag = 'EXACT' | 'LOWER' | 'UPPER';
type TTEntry = { depth: number; score: number; flag: TTFlag };

const TT = new Map<number, TTEntry>();
const MAX_TT_ENTRIES = 200_000;

export function resetTT() {
  TT.clear();
}

function ttKey(hash: number, perspective: Color): number {
  // Mistura a perspectiva no hash: nunca reaproveita uma avaliação
  // calculada para o lado errado (segurança caso a IA jogue de brancas no futuro)
  return perspective === 'w' ? hash : (hash ^ 0x9e3779b1) >>> 0;
}

export function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  timeBudget: number,
  perspective: Color
): { move: Move | null; score: number } {
  if (timeBudget && performance.now() - startTime > timeBudget) {
    return { move: null, score: 0 };
  }

  const hash = stateHash(state);
  const key = ttKey(hash, perspective);
  const tt = TT.get(key);
  if (tt && tt.depth >= depth) {
    if (tt.flag === 'EXACT') return { move: null, score: tt.score };
    if (tt.flag === 'LOWER') alpha = Math.max(alpha, tt.score);
    else if (tt.flag === 'UPPER') beta = Math.min(beta, tt.score);
    if (alpha >= beta) return { move: null, score: tt.score };
  }

  // ✅ Calcula os lances legais UMA vez só e reaproveita no getResult e no evaluate
  const legal = generateLegalMoves(state);
  const result = getResult(state, legal);

  if (depth === 0 || result !== '*') {
    const val = result === '*'
      ? evaluate(state, perspective, legal)
      : result === (perspective === 'w' ? '1-0' : '0-1')
        ? 900000 + depth   // prefere mates mais rápidos (usa menos profundidade restante)
        : result === (perspective === 'w' ? '0-1' : '1-0')
          ? -900000 - depth
          : 0;
    return { move: null, score: val };
  }

  // Ordenação MVV-LVA aproximada: captura de peça valiosa > promoção > resto
  const ordered = legal
    .map(m => {
      let priority = 0;
      const captured = state.board[m.to];
      if (captured) priority += 1000 + (PIECE_VALUES[captured.type] || 0);
      if (m.promotion) priority += 500 + (m.promotion === 'q' ? 400 : 0);
      return { m, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .map(o => o.m);

  let bestMove: Move | null = null;
  let bestScore = perspective === state.turn ? -Infinity : Infinity;

  for (const mv of ordered) {
    const { newState } = makeMove(state, mv);
    const { score } = minimax(newState, depth - 1, alpha, beta, startTime, timeBudget, perspective);

    if (state.turn === perspective) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = mv;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = mv;
      }
      beta = Math.min(beta, bestScore);
    }
    if (beta <= alpha) break;
  }

  const flag: TTFlag = bestScore <= alpha ? 'UPPER' : bestScore >= beta ? 'LOWER' : 'EXACT';
  if (TT.size > MAX_TT_ENTRIES) TT.clear();
  TT.set(key, { depth, score: bestScore, flag });

  return { move: bestMove, score: bestScore };
}
