import type { Board, Move, GameRules } from '@/types/checkers';
import { minimax, resetTT } from './checkersAI';
import { generateLegalMoves } from '@/lib/engine/checkers';

export type Difficulty = 'facil' | 'medio' | 'dificil';

const SETTINGS: Record<Difficulty, { maxDepth: number; budget: number }> = {
  facil: { maxDepth: 3, budget: 250 },
  medio: { maxDepth: 6, budget: 600 },
  dificil: { maxDepth: 9, budget: 1200 },
};

let worker: Worker | null = null;
let workerFailed = false;

function initWorker() {
  if (worker || workerFailed) return;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url));
  } catch (err) {
    console.warn('Worker de damas falhou, usando thread principal', err);
    workerFailed = true;
  }
}

/** Limpa a Transposition Table — chame ao reiniciar a partida. */
export function resetCheckersAI() {
  resetTT();
  if (worker) worker.postMessage({ type: 'reset' });
}

export async function askAI(
  board: Board,
  player: 1 | -1,
  difficulty: Difficulty,
  rules: GameRules
): Promise<Move | null> {
  initWorker();

  const { maxDepth, budget } = SETTINGS[difficulty];

  if (!workerFailed && worker) {
    return new Promise<Move | null>((resolve, reject) => {
      const onMsg = (e: MessageEvent) => {
        clean();
        resolve(e.data.move ?? null);
      };
      const onErr = (e: ErrorEvent) => {
        clean();
        console.warn('Erro no worker de damas', e);
        workerFailed = true;
        fallback().then(resolve).catch(reject);
      };
      const clean = () => {
        worker?.removeEventListener('message', onMsg);
        worker?.removeEventListener('error', onErr);
      };
      worker?.addEventListener('message', onMsg);
      worker?.addEventListener('error', onErr);
      worker?.postMessage({ board, player, difficulty, maxDepth, budget, rules });
    });
  }

  return fallback();

  async function fallback(): Promise<Move | null> {
    const start = performance.now();
    const legal = generateLegalMoves(board, player, rules);
    if (!legal.length) return null;

    if (difficulty === 'facil') {
      const idx = Math.floor(Math.random() * legal.length);
      return legal[idx];
    }

    let bestMove: Move | null = legal[0];
    for (let d = 1; d <= maxDepth; d++) {
      const { move } = minimax(board, player, d, -1e9, 1e9, start, budget, rules, player);
      if (move) bestMove = move;
      if (performance.now() - start > budget) break;
    }
    return bestMove;
  }
}
