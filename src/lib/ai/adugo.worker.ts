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

    // No modo fácil, a IA pensa raso e tem pouco tempo (pode errar mais rápido)
    if (difficulty === 'facil') { timeBudget = 150; maxDepth = 2; }
    // No modo médio, ela consegue ver uns pulos mas cai em armadilhas
    else if (difficulty === 'medio') { timeBudget = 600; maxDepth = 4; }
    // No modo difícil, ela procura até o fim!
    else if (difficulty === 'dificil') { timeBudget = 2500; maxDepth = 8; }

    const startTime = performance.now();
    
    // No modo fácil, embaralhamos a lista base para ela não pegar sempre a captura "perfeita" no mesmo empate
    let baseMoves = [...typedState.legalMoves];
    if (difficulty === 'facil') {
      baseMoves.sort(() => Math.random() - 0.5);
    }
    let bestGlobalMove = baseMoves[0];

    // Iterative deepening
    for (let d = 1; d <= maxDepth; d++) {
      if (performance.now() - startTime >= timeBudget) break;
      const { move } = minimaxAdugo(typedState, d, -Infinity, Infinity, startTime, timeBudget);
      if (move) bestGlobalMove = move;
    }

    self.postMessage({ type: 'RESULT', move: bestGlobalMove });
  }
});
