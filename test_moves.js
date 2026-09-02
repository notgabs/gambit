const { parseFEN } = require('./src/lib/chess/fen.ts');
const { generateLegalMoves } = require('./src/lib/chess/movegen.ts');

const state = parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
state.turn = 'b'; // fake black's turn
const moves = generateLegalMoves(state);
const pawnMoves = moves.filter(m => m.from === 51);
console.log('Moves for pawn at 51:', pawnMoves);
