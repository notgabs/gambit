import { AdugoBoard, AdugoMove, AdugoState } from '@/types/adugo';
import { generateLegalMoves, applyMove, ADJ, LINES } from '@/lib/engine/adugo';

export type AdugoDifficulty = 'facil' | 'medio' | 'dificil';

// Grafo Distâncias (Floyd-Warshall)
const DIST: number[][] = Array(31).fill(0).map(() => Array(31).fill(99));
for (let i = 0; i < 31; i++) DIST[i][i] = 0;
for (const [u, v] of LINES) { DIST[u][v] = 1; DIST[v][u] = 1; }
for (let k = 0; k < 31; k++) {
  for (let i = 0; i < 31; i++) {
    for (let j = 0; j < 31; j++) {
      if (DIST[i][j] > DIST[i][k] + DIST[k][j]) DIST[i][j] = DIST[i][k] + DIST[k][j];
    }
  }
}

const JAGUAR_PST = [
  10, 20, 20, 20, 10,
  20, 40, 50, 40, 20,
  20, 50,100, 50, 20, // Centro valioso
  20, 40, 50, 40, 20,
  10, 20, 20, 20, 10,
   5, 10,  5,
   0,  5,  0
];

// Always return score from Jaguar's (1) perspective
export function evaluateAdugo(state: AdugoState): number {
  const { board, dogsCaptured, winner, pliesWithoutCapture } = state;

  if (winner === 1) return 100000;
  if (winner === -1) return -100000;
  if (winner === 0) return 0; // Draw is neutral

  let jaguarPos = -1;
  const dogPositions: number[] = [];

  for (let i = 0; i < 31; i++) {
    if (board[i] === 1) jaguarPos = i;
    else if (board[i] === -1) dogPositions.push(i);
  }

  let score = dogsCaptured * 2500; // Valor muito menor! Os cães agora aceitam sacrificar 1 ou 2 peças se isso garantir o cerco.
  score -= pliesWithoutCapture * 10; // Cães perdem pontos ao enrolar

  if (jaguarPos !== -1) {
    score += JAGUAR_PST[jaguarPos];

    let jaguarMobility = 0;
    let vulnerableDogs = 0;
    for (const dest of ADJ[jaguarPos]) {
      if (board[dest] === 0) jaguarMobility++;
      if (board[dest] === -1) {
        for (const jumpDest of ADJ[dest]) {
          if (jumpDest !== jaguarPos && board[jumpDest] === 0) {
            vulnerableDogs++;
          }
        }
      }
    }

    // Mobilidade da Onça é a maior inimiga dos Cães. Cães vão focar em reduzir isso a zero.
    score += jaguarMobility * 800;
    if (jaguarMobility <= 1) score -= 5000; // Cheiro de vitória para os cães!
    score += vulnerableDogs * 1000; // Reduzi o peso de "cão vulnerável" pra eles não fugirem tanto

    let dogDistSum = 0;
    let dogsSurrounding = 0;
    for (const dog of dogPositions) {
      const d = DIST[dog][jaguarPos];
      dogDistSum += d;
      if (d === 1) dogsSurrounding++;
    }

    score += dogDistSum * 60; // Puxa todos os cães para perto
    score -= dogsSurrounding * 1500; // Recompensa absurda por cercar
  }

  return score;
}

// Transposition Table
const tt = new Map<string, { depth: number, score: number, flag: 'EXACT' | 'LOWER' | 'UPPER' }>();

export function clearAdugoTT() {
  tt.clear();
}

export function minimaxAdugo(
  state: AdugoState,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  timeBudget: number
): { move: AdugoMove | null; score: number } {
  if (timeBudget > 0 && performance.now() - startTime > timeBudget) {
    return { move: null, score: 0 }; 
  }

  const ttKey = state.board.join('') + state.turn;
  const ttEntry = tt.get(ttKey);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === 'EXACT') return { move: null, score: ttEntry.score };
    if (ttEntry.flag === 'LOWER') alpha = Math.max(alpha, ttEntry.score);
    else if (ttEntry.flag === 'UPPER') beta = Math.min(beta, ttEntry.score);
    if (alpha >= beta) return { move: null, score: ttEntry.score };
  }

  const legalMoves = state.legalMoves.length > 0 ? state.legalMoves : generateLegalMoves(state);

  // Quiescence extension
  let currentDepth = depth;
  if (currentDepth === 0 && state.turn === 1 && legalMoves.some(m => m.capture !== undefined)) {
    currentDepth = 1;
  }

  if (currentDepth === 0 || state.winner !== null || legalMoves.length === 0) {
    return { move: null, score: evaluateAdugo(state) };
  }

  // Move ordering
  const orderedMoves = [...legalMoves].sort((a, b) => {
    const aCap = a.capture !== undefined ? 100 : 0;
    const bCap = b.capture !== undefined ? 100 : 0;
    return bCap - aCap;
  });

  let bestMove: AdugoMove | null = orderedMoves[0] || null;
  const isMaximizing = state.turn === 1; // Jaguar maximizes
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let alphaOrig = alpha;

  for (const move of orderedMoves) {
    const nextState = applyMove(state, move);
    const { score } = minimaxAdugo(nextState, currentDepth - 1, alpha, beta, startTime, timeBudget);

    if (isMaximizing) {
      if (score > bestScore) { bestScore = score; bestMove = move; }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) { bestScore = score; bestMove = move; }
      beta = Math.min(beta, bestScore);
    }
    if (beta <= alpha) break;
  }

  if (timeBudget <= 0 || performance.now() - startTime <= timeBudget) {
    let flag: 'EXACT' | 'LOWER' | 'UPPER' = 'EXACT';
    if (bestScore <= alphaOrig) flag = 'UPPER';
    else if (bestScore >= beta) flag = 'LOWER';
    tt.set(ttKey, { depth: currentDepth, score: bestScore, flag });
  }

  return { move: bestMove, score: bestScore };
}
