import type { SurakartaState, SurakartaMove } from '@/types/surakarta';
import type { SurakartaWorkerOutput } from '@/workers/surakartaWorker';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (m: SurakartaMove | null) => void>();

const DIFFICULTY: Record<string, number> = { facil: 1, medio: 2, dificil: 3, impossivel: 4 };

function failAll() {
  for (const resolve of pending.values()) resolve(null);
  pending.clear();
}

function getWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL('../../workers/surakartaWorker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = (e: MessageEvent<SurakartaWorkerOutput>) => {
    const { id, move, error } = e.data;
    if (error) console.error('[SurakartaAI]', error);
    const resolve = pending.get(id);
    if (resolve) {
      pending.delete(id);
      resolve(move ?? null);
    }
  };

  worker.onerror = (ev) => {
    console.error('[SurakartaAI] worker error', ev.message);
    failAll();
    worker?.terminate();
    worker = null;
  };

  return worker;
}

export function askSurakartaAI(state: SurakartaState, difficultyStr: string): Promise<SurakartaMove | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);

  return new Promise(resolve => {
    const id = nextId++;
    pending.set(id, resolve);
    getWorker().postMessage({ id, state, difficulty: DIFFICULTY[difficultyStr] ?? 2 });
  });
}

export function resetSurakartaAI() {
  failAll();
  worker?.terminate();
  worker = null;
}
