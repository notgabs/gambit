import { minimaxAdugo, clearAdugoTT, AdugoDifficulty } from './adugoAI';
import type { AdugoState } from '@/types/adugo';

self.addEventListener('message', (e: MessageEvent) => {
  const { type, state, difficulty } = e.data;
  
  if (type === 'CLEAR') {
    clearAdugoTT();
    self.postMessage({ type: 'CLEARED' });
    return;
  }

  if (type === 'MOVE') {
    const typedState = state as AdugoState;
    let timeBudget = 1000;
    let maxDepth = 7;

    if (difficulty === 'facil') { timeBudget = 300; maxDepth = 3; }
    else if (difficulty === 'medio') { timeBudget = 800; maxDepth = 5; }
    else if (difficulty === 'dificil') { timeBudget = 2000; maxDepth = 8; }

    const startTime = performance.now();
    let bestGlobalMove = typedState.legalMoves[0];

    // Iterative deepening
    for (let d = 1; d <= maxDepth; d++) {
      if (performance.now() - startTime >= timeBudget) break;
      const { move } = minimaxAdugo(typedState, d, -Infinity, Infinity, startTime, timeBudget);
      if (move) bestGlobalMove = move;
    }

    self.postMessage({ type: 'RESULT', move: bestGlobalMove });
  }
});
