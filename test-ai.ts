import { newGame } from './src/lib/engine/checkers';
import { minimax } from './src/lib/ai/checkersAI';

const game = newGame({ canCaptureBackwards: true, kingStopsImmediately: false });
console.log("Starting minimax depth 7...");
const start = performance.now();
const result = minimax(game.board, -1, 7, -Infinity, Infinity, start, 0, game.rules, -1);
console.log("Done in", performance.now() - start, "ms", result);
