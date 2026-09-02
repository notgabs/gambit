import { GameState, Move } from './types';
import { minimax, resetTT } from './ai/minimax';
import { generateLegalMoves } from './movegen';

export type Difficulty = 'facil' | 'medio' | 'dificil';

let worker: Worker | null = null;
let workerFailed = false;

function initWorker() {
  if (worker || workerFailed) return;
  try {
    worker = new Worker(new URL('./ai/worker.ts', import.meta.url));
  } catch (err) {
    console.warn('Worker for chess failed, using main thread', err);
    workerFailed = true;
  }
}

/** Limpa a Transposition Table — chame ao reiniciar a partida. */
export function resetChessAI() {
  resetTT();
  if (worker) {
    worker.postMessage({ type: 'reset' });
  }
}

export async function askChessAI(state: GameState, difficulty: Difficulty): Promise<Move | null> {
  initWorker();

  const maxDepth = difficulty === 'facil' ? 2 : difficulty === 'medio' ? 4 : 5;
  const budget = difficulty === 'dificil' ? 1200 : difficulty === 'medio' ? 600 : 300;

  if (!workerFailed && worker) {
    return new Promise<Move | null>((resolve, reject) => {
      const onMsg = (e: MessageEvent) => {
        clean();
        resolve(e.data.move ?? null);
      };
      const onErr = (e: ErrorEvent) => {
        clean();
        console.warn('Worker error', e);
        workerFailed = true;
        fallback().then(resolve).catch(reject);
      };
      const clean = () => {
        worker?.removeEventListener('message', onMsg);
        worker?.removeEventListener('error', onErr);
      };
      worker?.addEventListener('message', onMsg);
      worker?.addEventListener('error', onErr);
      worker?.postMessage({ state, difficulty, maxDepth, budget });
    });
  }

  return fallback();

  async function fallback(): Promise<Move | null> {
    const start = performance.now();
    const legal = generateLegalMoves(state);
    if (!legal.length) return null;

    if (difficulty === 'facil') {
      const idx = Math.floor(Math.random() * legal.length);
      return legal[idx];
    }

    let bestMove: Move | null = null;
    for (let d = 1; d <= maxDepth; d++) {
      const { move } = minimax(state, d, -1e9, 1e9, start, budget, state.turn);
      if (move) bestMove = move;
      if (performance.now() - start > budget) break;
    }
    return bestMove;
  }
}
