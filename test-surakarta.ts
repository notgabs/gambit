import { generateLegalMoves } from './src/lib/engine/surakarta';

const board = [
  [ 1,  1,  1,  1,  1,  1],
  [ 1,  1,  1,  1,  1,  1],
  [ 0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  1,  0,  0],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
] as any;

const state = {
  board,
  turn: -1 as const,
  winner: null,
  history: [],
  pliesWithoutCapture: 0
};

const moves = generateLegalMoves(state);
const captureMoves = moves.filter(m => m.fromX === 2 && m.fromY === 5 && m.isCapture);
console.log("Captures for (2,5):", captureMoves);
