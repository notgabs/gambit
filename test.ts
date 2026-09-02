import { parseFEN } from './src/lib/chess/fen';
import { generateLegalMoves } from './src/lib/chess/movegen';

const state = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
state.turn = 'b';
const moves = generateLegalMoves(state);
const d7 = moves.filter(m => m.from === 51);
console.log('d7 moves:', d7);
