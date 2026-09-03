import { SurakartaState, SurakartaMove } from '@/types/surakarta';

let worker: Worker | null = null;

export function askSurakartaAI(state: SurakartaState, difficultyStr: string): Promise<SurakartaMove | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    if (!worker) {
      worker = new Worker(new URL('@/workers/surakartaWorker.ts', import.meta.url), { type: 'module' });
    }

    let diff = 2; // Default to medio
    if (difficultyStr === 'facil') diff = 1;
    if (difficultyStr === 'dificil') diff = 3;
    if (difficultyStr === 'impossivel') diff = 4;

    const onMessage = (e: MessageEvent) => {
      worker?.removeEventListener('message', onMessage);
      resolve(e.data.move);
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage({ state, difficulty: diff });
  });
}

export function resetSurakartaAI() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
