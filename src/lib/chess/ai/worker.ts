import { minimax, resetTT } from './minimax';
import { generateLegalMoves } from '../movegen';

self.addEventListener('message', (e: MessageEvent) => {
  const data = e.data;

  if (data?.type === 'reset') {
    resetTT();
    return;
  }

  const { state, difficulty, maxDepth, budget } = data;
  const start = performance.now();

  const legal = generateLegalMoves(state);
  if (!legal.length) {
    self.postMessage({ move: null });
    return;
  }

  if (difficulty === 'facil') {
    const idx = Math.floor(Math.random() * legal.length);
    self.postMessage({ move: legal[idx] });
    return;
  }

  let bestMove = null;
  for (let d = 1; d <= maxDepth; d++) {
    const { move } = minimax(state, d, -1e9, 1e9, start, budget, state.turn);
    if (move) bestMove = move;
    if (performance.now() - start > budget) break;
  }

  self.postMessage({ move: bestMove });
});
