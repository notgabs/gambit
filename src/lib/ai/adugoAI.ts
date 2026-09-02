import { AdugoBoard, AdugoMove, AdugoState } from '@/types/adugo';
import { generateLegalMoves, applyMove, ADJ, LINES } from '@/lib/engine/adugo';

export type AdugoDifficulty = 'facil' | 'medio' | 'dificil';

// Matriz de distâncias curtas no grafo (Floyd-Warshall)
const DIST: number[][] = Array(31).fill(0).map(() => Array(31).fill(99));
for (let i = 0; i < 31; i++) DIST[i][i] = 0;
for (const [u, v] of LINES) {
  DIST[u][v] = 1;
  DIST[v][u] = 1;
}
for (let k = 0; k < 31; k++) {
  for (let i = 0; i < 31; i++) {
    for (let j = 0; j < 31; j++) {
      if (DIST[i][j] > DIST[i][k] + DIST[k][j]) {
        DIST[i][j] = DIST[i][k] + DIST[k][j];
      }
    }
  }
}

const JAGUAR_PST = [
  20, 30, 30, 30, 20,
  30, 50, 60, 50, 30,
  30, 60, 100, 60, 30, // Centro
  30, 50, 60, 50, 30,
  20, 30, 30, 30, 20,
  10, 10, 10,
   5,  5,
   0
];

export function evaluateAdugo(state: AdugoState, originalPlayer: 1 | -1): number {
  const { board, dogsCaptured, winner, history } = state;

  if (winner === 1) return originalPlayer === 1 ? 100000 : -100000;
  if (winner === -1) return originalPlayer === -1 ? 100000 : -100000;

  let jaguarPos = -1;
  const dogPositions: number[] = [];

  for (let i = 0; i < 31; i++) {
    if (board[i] === 1) jaguarPos = i;
    else if (board[i] === -1) dogPositions.push(i);
  }

  let score = dogsCaptured * 6000;

  if (jaguarPos !== -1) {
    score += JAGUAR_PST[jaguarPos] || 0;

    const jaguarMovesCount = countJaguarMoves(board, jaguarPos);
    score += jaguarMovesCount * 400;

    if (jaguarMovesCount <= 2) {
      score -= (3 - jaguarMovesCount) * 2000;
    }

    const vulnerableDogs = countVulnerableDogs(board, jaguarPos);
    score += vulnerableDogs * 1500;

    let dogDistSum = 0;
    let dogsSurrounding = 0;

    for (const dog of dogPositions) {
      const d = DIST[dog][jaguarPos];
      dogDistSum += d;
      if (d === 1) dogsSurrounding++;
    }

    score -= dogDistSum * 50;
    score -= dogsSurrounding * 800;
  }

  // ⚡ PENALIDADE DE REPETIÇÃO (Evita o loop infinito de 2 movimentos)
  if (history && history.length > 2) {
    const currentKey = board.join('');
    let occurrences = 0;
    for (const h of history) {
      if (h === currentKey) occurrences++;
    }
    if (occurrences > 1) {
      score -= 8000; // Penaliza fortemente repetir posições já visitadas
    }
  }

  return originalPlayer === 1 ? score : -score;
}

function countJaguarMoves(board: AdugoBoard, jaguarPos: number): number {
  if (jaguarPos === -1) return 0;
  let count = 0;
  for (const dest of ADJ[jaguarPos]) {
    if (board[dest] === 0) count++;
  }
  return count;
}

function countVulnerableDogs(board: AdugoBoard, jaguarPos: number): number {
  if (jaguarPos === -1) return 0;
  let count = 0;
  for (const victim of ADJ[jaguarPos]) {
    if (board[victim] === -1) {
      for (const dest of ADJ[victim]) {
        if (dest !== jaguarPos && board[dest] === 0) {
          count++;
        }
      }
    }
  }
  return count;
}

export function minimaxAdugo(
  state: AdugoState,
  depth: number,
  alpha: number,
  beta: number,
  startTime: number,
  timeBudget: number,
  originalPlayer: 1 | -1
): { move: AdugoMove | null; score: number } {
  if (timeBudget > 0 && performance.now() - startTime > timeBudget) {
    return { move: null, score: 0 };
  }

  const legalMoves = state.legalMoves.length > 0 ? state.legalMoves : generateLegalMoves(state);

  if (depth === 0 || state.winner !== null || legalMoves.length === 0) {
    return { move: null, score: evaluateAdugo(state, originalPlayer) };
  }

  const orderedMoves = [...legalMoves].sort((a, b) => {
    const aCap = a.capture !== undefined ? 100 : 0;
    const bCap = b.capture !== undefined ? 100 : 0;
    return bCap - aCap;
  });

  let bestMove: AdugoMove | null = orderedMoves[0] || null;
  const isMaximizing = state.turn === originalPlayer;
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of orderedMoves) {
    const nextState = applyMove(state, move);
    const { score } = minimaxAdugo(
      nextState,
      depth - 1,
      alpha,
      beta,
      startTime,
      timeBudget,
      originalPlayer
    );

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) break;
  }

  return { move: bestMove, score: bestScore };
}
