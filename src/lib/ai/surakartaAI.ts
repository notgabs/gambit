import { SurakartaState, SurakartaMove } from '@/types/surakarta';
import { generateLegalMoves, applyMove } from '../engine/surakarta';

function evaluateBoard(state: SurakartaState, maximizingPlayer: 1 | -1): number {
  if (state.winner === maximizingPlayer) return 10000;
  if (state.winner === (maximizingPlayer === 1 ? -1 : 1)) return -10000;
  if (state.winner === 0) return 0;

  let score = 0;
  const board = state.board;

  // Material and position
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      const piece = board[y][x];
      if (piece === 0) continue;

      const pieceValue = piece === maximizingPlayer ? 100 : -100;
      score += pieceValue;

      // Centrality bonus (0.5 to 2 points)
      const cx = x === 2 || x === 3 ? 2 : (x === 1 || x === 4 ? 1 : 0);
      const cy = y === 2 || y === 3 ? 2 : (y === 1 || y === 4 ? 1 : 0);
      const centerBonus = (cx + cy);
      score += piece === maximizingPlayer ? centerBonus : -centerBonus;
    }
  }

  // Mobility & Threat
  // We don't do full threat analysis because it's too expensive, but mobility is a proxy
  const myMoves = generateLegalMoves({ ...state, turn: maximizingPlayer });
  const enemyMoves = generateLegalMoves({ ...state, turn: maximizingPlayer === 1 ? -1 : 1 });

  // A capture move is highly valuable
  const myCaptures = myMoves.filter(m => m.isCapture).length;
  const enemyCaptures = enemyMoves.filter(m => m.isCapture).length;

  score += (myMoves.length * 1) + (myCaptures * 10);
  score -= (enemyMoves.length * 1) + (enemyCaptures * 10);

  return score;
}

export function getBestMoveSurakarta(
  state: SurakartaState,
  depth: number
): SurakartaMove | null {
  const maximizingPlayer = state.turn;

  // For the root, we want to collect moves and sort them for better alpha-beta pruning
  const legalMoves = generateLegalMoves(state);
  if (legalMoves.length === 0) return null;

  // Sort captures first
  legalMoves.sort((a, b) => (b.isCapture ? 1 : 0) - (a.isCapture ? 1 : 0));

  let bestMove: SurakartaMove | null = null;
  let maxEval = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  // Add some randomness if there are multiple "best" moves
  const bestMoves: SurakartaMove[] = [];

  for (const move of legalMoves) {
    const nextState = applyMove(state, move);
    const ev = minimax(nextState, depth - 1, alpha, beta, false, maximizingPlayer);

    if (ev > maxEval) {
      maxEval = ev;
      bestMoves.length = 0;
      bestMoves.push(move);
    } else if (ev === maxEval) {
      bestMoves.push(move);
    }

    alpha = Math.max(alpha, ev);
  }

  if (bestMoves.length > 0) {
    // Pick a random move among the equally best ones
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  return bestMove;
}

function minimax(
  state: SurakartaState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  maximizingPlayer: 1 | -1
): number {
  if (depth === 0 || state.winner !== null) {
    return evaluateBoard(state, maximizingPlayer);
  }

  const legalMoves = generateLegalMoves(state);
  // Sort captures first for alpha-beta efficiency
  legalMoves.sort((a, b) => (b.isCapture ? 1 : 0) - (a.isCapture ? 1 : 0));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const nextState = applyMove(state, move);
      const ev = minimax(nextState, depth - 1, alpha, beta, false, maximizingPlayer);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break; // Prune
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const nextState = applyMove(state, move);
      const ev = minimax(nextState, depth - 1, alpha, beta, true, maximizingPlayer);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break; // Prune
    }
    return minEval;
  }
}
