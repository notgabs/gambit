import { minimax, resetTT } from './checkersAI';
import { generateLegalMoves } from '../engine/checkers';

self.addEventListener('message', (e: MessageEvent) => {
  const data = e.data;

  if (data?.type === 'reset') {
    resetTT();
    return;
  }

  const { board, player, difficulty, maxDepth, budget, rules } = data;
  const start = performance.now();

  const legal = generateLegalMoves(board, player, rules);
  if (!legal.length) {
    self.postMessage({ move: null });
    return;
  }

  if (difficulty === 'facil') {
    const idx = Math.floor(Math.random() * legal.length);
    self.postMessage({ move: legal[idx] });
    return;
  }

  let bestMove = legal[0];
  for (let d = 1; d <= maxDepth; d++) {
    const { move } = minimax(board, player, d, -1e9, 1e9, start, budget, rules, player);
    if (move) bestMove = move;
    if (performance.now() - start > budget) break;
  }

  self.postMessage({ move: bestMove });
});
