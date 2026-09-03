import { SurakartaState, SurakartaMove } from '@/types/surakarta';
import { getBestMoveSurakarta } from '@/lib/ai/surakartaAI';

export interface SurakartaWorkerInput {
  state: SurakartaState;
  difficulty: number;
}

export interface SurakartaWorkerOutput {
  move: SurakartaMove | null;
}

self.onmessage = (e: MessageEvent<SurakartaWorkerInput>) => {
  const { state, difficulty } = e.data;
  
  // Depth based on difficulty: 1 -> 2, 2 -> 3, 3 -> 4
  const depth = difficulty + 1;

  const move = getBestMoveSurakarta(state, depth);

  self.postMessage({ move } as SurakartaWorkerOutput);
};
