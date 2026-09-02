import { generateLegalMoves } from '@/lib/engine/checkers';
import { minimax } from './checkersAI';

self.addEventListener('message', (e) => {
  const { board, player, level, rules } = e.data;
  
  const legal = generateLegalMoves(board, player, rules);
  if (legal.length === 0) {
    self.postMessage({ move: null });
    return;
  }

  if (level === 'facil') {
    const idx = Math.floor(Math.random() * legal.length);
    self.postMessage({ move: legal[idx] });
    return;
  }

  const maxDepth = level === 'medio' ? 3 : 5;
  const startTime = performance.now();
  const budget = level === 'dificil' ? 650 : 0; 

  let bestMove = legal[0];
  let bestScore = -Infinity;

  for (let d = 1; d <= maxDepth; d++) {
    const { move, score } = minimax(board, player, d, -Infinity, Infinity, startTime, budget, rules, player);
    if (move === null) break; 
    bestMove = move;
    bestScore = score;
  }

  self.postMessage({ move: bestMove, score: bestScore });
});
