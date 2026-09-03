import type { AdugoState, AdugoMove } from '@/types/adugo';
import type { AdugoDifficulty } from './adugoAI';

let worker: Worker | null = null;

export function resetAdugoAI() {
  if (worker) {
    worker.postMessage({ type: 'CLEAR' });
  }
}

export function askAdugoAI(state: AdugoState, difficulty: AdugoDifficulty): Promise<AdugoMove> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    
    if (!worker) {
      worker = new Worker(new URL('./adugo.worker.ts', import.meta.url));
    }

    const handler = (e: MessageEvent) => {
      if (e.data.type === 'RESULT') {
        worker?.removeEventListener('message', handler);
        resolve(e.data.move);
      }
    };

    worker.addEventListener('message', handler);
    worker.postMessage({ type: 'MOVE', state, difficulty });
  });
}
