import type { SurakartaState, SurakartaMove } from '@/types/surakarta';
import { getBestMoveSurakarta } from '@/lib/ai/surakartaAI';

export interface SurakartaWorkerInput {
  id: number;
  state: SurakartaState;
  difficulty: number;
}

export interface SurakartaWorkerOutput {
  id: number;
  move: SurakartaMove | null;
  error?: string;
}

/** difficulty 1..3 → depth 2..4, difficulty 4 (impossível) → depth 7 */
const depthFor = (difficulty: number) => (difficulty === 4 ? 7 : Math.max(1, Math.min(difficulty + 1, 4)));

self.onmessage = (e: MessageEvent<SurakartaWorkerInput>) => {
  const { id, state, difficulty } = e.data;
  try {
    const move = getBestMoveSurakarta(state, depthFor(difficulty));
    self.postMessage({ id, move } satisfies SurakartaWorkerOutput);
  } catch (err) {
    self.postMessage({ id, move: null, error: String(err) } satisfies SurakartaWorkerOutput);
  }
};
