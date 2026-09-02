import { AdugoState, AdugoMove } from '@/types/adugo';
import { minimaxAdugo, AdugoDifficulty } from './adugoAI';
import { generateLegalMoves } from '@/lib/engine/adugo';

const SETTINGS: Record<AdugoDifficulty, { maxDepth: number; budget: number }> = {
  facil: { maxDepth: 2, budget: 200 },
  medio: { maxDepth: 4, budget: 500 },
  dificil: { maxDepth: 6, budget: 1000 },
};

export async function askAdugoAI(
  state: AdugoState,
  difficulty: AdugoDifficulty
): Promise<AdugoMove | null> {
  const legal = state.legalMoves.length > 0 ? state.legalMoves : generateLegalMoves(state);
  if (!legal.length) return null;

  // Nível Fácil: Escolhe um lance aleatório com 40% de chance de jogada inteligente
  if (difficulty === 'facil' && Math.random() > 0.4) {
    const captures = legal.filter(m => m.capture !== undefined);
    if (captures.length > 0) return captures[Math.floor(Math.random() * captures.length)];
    return legal[Math.floor(Math.random() * legal.length)];
  }

  const { maxDepth, budget } = SETTINGS[difficulty];
  const startTime = performance.now();
  let bestMove: AdugoMove | null = legal[0];

  // Iterative Deepening
  for (let d = 1; d <= maxDepth; d++) {
    const { move } = minimaxAdugo(state, d, -Infinity, Infinity, startTime, budget, state.turn);
    if (move) bestMove = move;
    if (performance.now() - startTime > budget) break;
  }

  return bestMove;
}
